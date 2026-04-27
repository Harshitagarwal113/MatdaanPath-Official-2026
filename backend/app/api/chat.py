import os
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlmodel import Session, or_, select

from app.core.database import get_session
from app.core.logging import get_logger, report_exception
from app.core.settings import get_settings
from app.models import GlossaryItem, Source, Stage
from app.services.google_secret_manager import get_secret_payload

router = APIRouter()
logger = get_logger("chat")

# ---------------------------------------------------------------------------
# AI client initialisation
# Try google-genai SDK with GEMINI_API_KEY first; fall back to Vertex AI ADC.
# ---------------------------------------------------------------------------

_client = None
_provider = "unconfigured"


def _init_client():
    global _client, _provider

    settings = get_settings()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    api_key_source = "env"
    if not api_key and settings.secret_manager_enabled:
        api_key = get_secret_payload(settings.gemini_api_key_secret) or ""
        api_key_source = "secret_manager" if api_key else "unavailable"

    project = settings.google_cloud_project
    location = settings.google_cloud_location or "us-central1"

    try:
        from google import genai

        # Prefer a proper API key (starts with "AI") over Vertex/ADC tokens.
        if api_key and api_key.startswith("AI"):
            _client = genai.Client(api_key=api_key)
            _provider = "gemini_api_key"
            logger.info("Chat configured with Gemini API key (%s).", api_key_source)
        elif project:
            # Use Vertex AI via Application Default Credentials.
            _client = genai.Client(
                vertexai=True,
                project=project,
                location=location,
            )
            _provider = "vertex_ai"
            logger.info("Chat configured with Vertex AI (project=%s, location=%s).", project, location)
        else:
            _provider = "unconfigured"
            logger.warning("Chat service unavailable. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.")
    except Exception as exc:
        _provider = "unconfigured"
        logger.warning("Chat client initialization failed: %s", exc)


_init_client()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=500)


class ChatSource(BaseModel):
    name: str
    url: str
    source_type: str
    last_verified_at: str | None = None


class ChatResponse(BaseModel):
    response: str
    sources: list[ChatSource] = Field(default_factory=list)
    disclaimer: str | None = None
    fallback_used: bool = False


# ---------------------------------------------------------------------------
# Context retrieval
# ---------------------------------------------------------------------------

MAX_QUERY_TERMS = 8
MAX_GLOSSARY_CONTEXT_ITEMS = 3
MAX_STAGE_CONTEXT_ITEMS = 2
MAX_SOURCE_CONTEXT_ITEMS = 3

CHAT_RATE_LIMIT_REQUESTS = max(1, int(os.getenv("CHAT_RATE_LIMIT_REQUESTS", "20")))
CHAT_RATE_WINDOW_SECONDS = max(10, int(os.getenv("CHAT_RATE_WINDOW_SECONDS", "60")))

_chat_rate_limit_window: dict[str, deque[float]] = defaultdict(deque)


def _extract_query_terms(query: str) -> list[str]:
    terms: list[str] = []
    for raw_word in query.split():
        cleaned = raw_word.strip(".,!?;:\"'()[]{}").lower()
        if len(cleaned) < 3:
            continue
        if cleaned not in terms:
            terms.append(cleaned)
        if len(terms) == MAX_QUERY_TERMS:
            break
    return terms


def _source_to_response(source: Source) -> ChatSource:
    return ChatSource(
        name=source.name,
        url=source.url,
        source_type=source.source_type,
        last_verified_at=source.last_verified_at.isoformat() if source.last_verified_at else None,
    )


def _get_relevant_sources(terms: list[str], session: Session) -> list[ChatSource]:
    approved_sources = select(Source).where(Source.status == "approved")

    if terms:
        source_filters = [Source.name.ilike(f"%{term}%") for term in terms] + [
            Source.url.ilike(f"%{term}%") for term in terms
        ] + [Source.source_type.ilike(f"%{term}%") for term in terms]
        source_statement = (
            approved_sources
            .where(or_(*source_filters))
            .order_by(Source.last_verified_at.desc(), Source.id.desc())
            .limit(MAX_SOURCE_CONTEXT_ITEMS)
        )
        matches = session.exec(source_statement).all()
        if matches:
            return [_source_to_response(source) for source in matches]

    fallback_statement = (
        approved_sources
        .order_by(Source.last_verified_at.desc(), Source.id.desc())
        .limit(MAX_SOURCE_CONTEXT_ITEMS)
    )
    fallback_sources = session.exec(fallback_statement).all()
    return [_source_to_response(source) for source in fallback_sources]


def get_context_bundle(query: str, session: Session) -> tuple[str, list[ChatSource]]:
    """Retrieve relevant context from glossary and timeline records plus source citations."""
    context_items: list[str] = []
    terms = _extract_query_terms(query)
    sources = _get_relevant_sources(terms, session)

    if not terms:
        return "", sources

    glossary_filters = [GlossaryItem.term.ilike(f"%{term}%") for term in terms] + [
        GlossaryItem.definition.ilike(f"%{term}%") for term in terms
    ]
    glossary_statement = (
        select(GlossaryItem)
        .where(or_(*glossary_filters))
        .order_by(GlossaryItem.term)
        .limit(MAX_GLOSSARY_CONTEXT_ITEMS)
    )
    glossary_items = session.exec(glossary_statement).all()
    for item in glossary_items:
        context_items.append(f"Glossary: {item.term} means {item.definition}")

    stage_filters = [Stage.name.ilike(f"%{term}%") for term in terms] + [
        Stage.description.ilike(f"%{term}%") for term in terms
    ]
    stage_statement = (
        select(Stage)
        .where(or_(*stage_filters))
        .order_by(Stage.sequence_order)
        .limit(MAX_STAGE_CONTEXT_ITEMS)
    )
    stages = session.exec(stage_statement).all()
    for stage in stages:
        context_items.append(f"Election Stage: {stage.name} - {stage.description}")

    return "\n".join(context_items), sources


def get_context(query: str, session: Session) -> str:
    context, _ = get_context_bundle(query, session)
    return context


def _get_client_key(request: Request) -> str:
    return request.client.host if request.client else "anonymous"


def _is_rate_limited(client_key: str) -> bool:
    now = time.monotonic()
    threshold = now - CHAT_RATE_WINDOW_SECONDS
    request_times = _chat_rate_limit_window[client_key]

    while request_times and request_times[0] < threshold:
        request_times.popleft()

    if len(request_times) >= CHAT_RATE_LIMIT_REQUESTS:
        return True

    request_times.append(now)
    return False


def _fallback_response(context: str) -> str:
    if context:
        context_lines = [line.strip() for line in context.splitlines() if line.strip()][:3]
        compact_context = " ".join(context_lines)
        return (
            "The live AI assistant is temporarily unavailable. "
            f"Based on our verified election knowledge: {compact_context}. "
            "Please verify final details using the official sources below."
        )

    return (
        "The live AI assistant is temporarily unavailable. "
        "Please check official Election Commission resources listed below for the latest guidance."
    )


# ---------------------------------------------------------------------------
# Chat endpoint
# ---------------------------------------------------------------------------

_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-2.0-flash-lite")

_SYSTEM_PROMPT = (
    "You are the MatdaanPath Assistant, a trustworthy AI guide for the Indian "
    "democratic process. Your goal is to provide verified, simple, and accurate "
    "information about elections in India. Always be polite, professional, and "
    "neutral. Do not express political opinions. If you are unsure, advise the "
    "user to check the official Election Commission of India (ECI) website. "
    "Use the following verified context from our database if relevant:\n"
)
_GENERAL_DISCLAIMER = (
    "This guidance is educational. For final confirmation, verify details on official Election Commission portals."
)
_FALLBACK_DISCLAIMER = (
    "Live AI is currently unavailable. This response uses stored MatdaanPath context and official reference links."
)


def get_chat_service_status() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        "gemini_enabled": _client is not None,
        "provider": _provider,
        "model": _MODEL_ID,
        "vertex_project_configured": bool(settings.google_cloud_project),
        "vertex_location": settings.google_cloud_location,
        "secret_manager_enabled": settings.secret_manager_enabled,
    }


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, http_request: Request, session: Session = Depends(get_session)):
    client_key = _get_client_key(http_request)
    if _is_rate_limited(client_key):
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many chat requests from this client. "
                "Please wait a moment before sending another question."
            ),
        )

    logger.info("Chat request received: %s...", request.message[:50])
    context, sources = get_context_bundle(request.message, session)
    system_instruction = _SYSTEM_PROMPT + context

    if _client is None:
        return ChatResponse(
            response=_fallback_response(context),
            sources=sources,
            disclaimer=_FALLBACK_DISCLAIMER,
            fallback_used=True,
        )

    try:
        from google.genai import types

        response = _client.models.generate_content(
            model=_MODEL_ID,
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
                max_output_tokens=512,
            ),
        )
        output_text = response.text or "I could not generate a response. Please rephrase your question."
        logger.info("Successfully generated AI response via provider %s.", _provider)
        return ChatResponse(
            response=output_text,
            sources=sources,
            disclaimer=_GENERAL_DISCLAIMER,
            fallback_used=False,
        )

    except Exception as exc:
        error_msg = str(exc).upper()
        logger.exception("ChatBot error: %s", error_msg)
        report_exception()

        # Specific handling for permission errors.
        if "PERMISSION_DENIED" in error_msg or "DENIED_ACCESS" in error_msg or "403" in error_msg:
            return ChatResponse(
                response=(
                    "The AI service project has denied access. "
                    "Please review the project status in Google Cloud and refresh API credentials if needed. "
                    + _fallback_response(context)
                ),
                sources=sources,
                disclaimer=_FALLBACK_DISCLAIMER,
                fallback_used=True,
            )

        # Specific handling for quota/rate limits.
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
            return ChatResponse(
                response=(
                    "The AI service quota is currently exhausted. "
                    "Please try again later or upgrade your plan. "
                    + _fallback_response(context)
                ),
                sources=sources,
                disclaimer=_FALLBACK_DISCLAIMER,
                fallback_used=True,
            )

        # Invalid credentials.
        if "API_KEY_INVALID" in error_msg or "401" in error_msg:
            return ChatResponse(
                response=(
                    "The configured API key appears invalid. "
                    "Please update GEMINI_API_KEY and retry. "
                    + _fallback_response(context)
                ),
                sources=sources,
                disclaimer=_FALLBACK_DISCLAIMER,
                fallback_used=True,
            )

        return ChatResponse(
            response=_fallback_response(context),
            sources=sources,
            disclaimer=_FALLBACK_DISCLAIMER,
            fallback_used=True,
        )
