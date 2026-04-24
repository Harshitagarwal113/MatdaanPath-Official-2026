import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.logging import get_logger, report_exception
from app.models import GlossaryItem, Stage

router = APIRouter()

# ---------------------------------------------------------------------------
# AI client initialisation
# Try google-genai SDK with GEMINI_API_KEY first; fall back to Vertex AI ADC.
# ---------------------------------------------------------------------------

_client = None
_use_vertex = False

def _init_client():
    global _client, _use_vertex

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    project  = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1").strip()

    try:
        from google import genai

        # Prefer a proper API key (starts with "AI") over Vertex/ADC tokens
        if api_key and api_key.startswith("AI"):
            _client = genai.Client(api_key=api_key)
            _use_vertex = False
            print("ChatBot: using google-genai with GEMINI_API_KEY")
        elif project:
            # Use Vertex AI via Application Default Credentials
            _client = genai.Client(
                vertexai=True,
                project=project,
                location=location,
            )
            _use_vertex = True
            print(f"ChatBot: using Vertex AI (project={project}, location={location})")
        else:
            print("ChatBot: WARNING – no valid credentials found; chat will be unavailable.")
    except Exception as exc:
        print(f"ChatBot: client initialisation failed – {exc}")

_init_client()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=500)

class ChatResponse(BaseModel):
    response: str


# ---------------------------------------------------------------------------
# Context retrieval
# ---------------------------------------------------------------------------

def get_context(query: str, session: Session) -> str:
    """Retrieves relevant context from the database based on the query."""
    context: list[str] = []
    words = {word.strip(".,!?").lower() for word in query.split() if len(word) >= 3}

    for word in words:
        items = session.exec(
            select(GlossaryItem).where(GlossaryItem.term.ilike(f"%{word}%"))
        ).all()
        for item in items:
            context.append(f"Glossary: {item.term} means {item.definition}")

    stages = session.exec(
        select(Stage).where(Stage.name.ilike(f"%{query}%"))
    ).all()
    for stage in stages:
        context.append(f"Election Stage: {stage.name} - {stage.description}")

    return "\n".join(context[:5])


# ---------------------------------------------------------------------------
# Chat endpoint
# ---------------------------------------------------------------------------

_MODEL_ID = "gemini-2.0-flash-lite"

_SYSTEM_PROMPT = (
    "You are the MatdaanPath Assistant, a trustworthy AI guide for the Indian "
    "democratic process. Your goal is to provide verified, simple, and accurate "
    "information about elections in India. Always be polite, professional, and "
    "neutral. Do not express political opinions. If you are unsure, advise the "
    "user to check the official Election Commission of India (ECI) website. "
    "Use the following verified context from our database if relevant:\n"
)

logger = get_logger("chat")

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, session: Session = Depends(get_session)):
    if _client is None:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured."
        )
    logger.info("Chat request received: %s...", request.message[:50])
    context = get_context(request.message, session)
    system_instruction = _SYSTEM_PROMPT + context

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
        logger.info("Successfully generated AI response.")
        return ChatResponse(response=response.text)

    except Exception as exc:
        error_msg = str(exc).upper()
        logger.exception("ChatBot error: %s", error_msg)
        report_exception()

        # Specific handling for Permission Denied (Project restricted/suspended)
        if "PERMISSION_DENIED" in error_msg or "DENIED_ACCESS" in error_msg or "403" in error_msg:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The AI service project has been restricted or denied access. "
                    "Please check your Google Cloud Console for project status or "
                    "update the GEMINI_API_KEY with a fresh one from AI Studio."
                ),
            )
        
        # Specific handling for Quota/Rate Limits
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
            raise HTTPException(
                status_code=503,
                detail=(
                    "The AI service quota has been exhausted. "
                    "The free tier has a limit of 1,500 requests per day. "
                    "Please try again later or upgrade your plan."
                ),
            )

        # Invalid Credentials
        if "API_KEY_INVALID" in error_msg or "401" in error_msg:
            raise HTTPException(
                status_code=503,
                detail="Invalid API key. Please update the GEMINI_API_KEY in your .env file.",
            )

        raise HTTPException(
            status_code=500,
            detail="Error generating AI response. Please try again later.",
        )
