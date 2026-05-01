"""
Main entry point for the MatdaanPath API.
Configures FastAPI application, middlewares, and routers.
"""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.api.admin import router as admin_router
from app.api.chat import router as chat_router
from app.api.deadlines import router as deadlines_router
from app.api.eligibility import router as eligibility_router
from app.api.glossary import router as glossary_router
from app.api.google_services import router as google_services_router
from app.api.reminders import router as reminders_router
from app.api.timeline import router as timeline_router
from app.core.database import get_session
from app.core.health import get_table_counts
from app.core.logging import (
    get_logger,
    get_observability_status,
    setup_logging,
)

load_dotenv(override=True)

setup_logging()
logger = get_logger("matdaanpath")


def _get_allowed_origins() -> list[str]:
    """Retrieve allowed CORS origins from environment or defaults."""
    configured_origins = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if configured_origins:
        return [
            origin.strip()
            for origin in configured_origins.split(",")
            if origin.strip()  # noqa: E501
        ]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def _cache_control_for_path(path: str) -> str:
    """Determine the appropriate Cache-Control header value for a given API path."""
    if path.startswith("/api/chat") or path.startswith("/health"):
        return "no-store"
    if path.startswith("/api/google-services/status"):
        return "private, max-age=30"
    if path.startswith("/api/"):
        return "public, max-age=120"
    return ""


class ApiCacheControlMiddleware(BaseHTTPMiddleware):
    """Middleware to inject Cache-Control headers into API responses."""
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        if request.method != "GET":
            return response

        cache_control = _cache_control_for_path(request.url.path)
        if cache_control and "Cache-Control" not in response.headers:
            response.headers["Cache-Control"] = cache_control
            response.headers["Vary"] = "Accept, Origin"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to inject security-related HTTP headers into every response."""
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["X-DNS-Prefetch-Control"] = "off"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "script-src 'self' 'unsafe-inline' https://www.gstatic.com; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.google-analytics.com"  # noqa: E501
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        if request.url.scheme == "https":
            response.headers[
                "Strict-Transport-Security"
            ] = (  # pragma: no cover  # noqa: E501
                "max-age=63072000; includeSubDomains; preload"
            )
        return response


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Manage application startup and shutdown events."""
    logger.info("MatdaanPath API starting up...")
    yield


app = FastAPI(
    title="MatdaanPath API",
    description="Backend API for the Election Process Education Assistant",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type"],
)
app.add_middleware(ApiCacheControlMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(timeline_router, prefix="/api/timeline", tags=["Timeline"])
app.include_router(
    eligibility_router, prefix="/api/eligibility", tags=["Eligibility"]
)  # noqa: E501
app.include_router(glossary_router, prefix="/api/glossary", tags=["Glossary"])
app.include_router(
    deadlines_router, prefix="/api/deadlines", tags=["Deadlines"]
)  # noqa: E501
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(
    google_services_router,
    prefix="/api/google-services",
    tags=["Google Services"],
)
app.include_router(
    reminders_router, prefix="/api/reminders", tags=["Reminders"]
)  # noqa: E501
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
def read_root():
    """Simple root endpoint for API discovery."""
    return {"message": "Welcome to MatdaanPath API"}


@app.get("/health")
def health_check():
    """Basic health check endpoint for container orchestrators."""
    return {"status": "healthy"}


@app.get("/health/detailed")
def detailed_health_check(session: Session = Depends(get_session)):
    """Comprehensive health check including database connectivity and data seeding status."""
    try:
        table_counts = get_table_counts(session)
    except Exception as exc:
        logger.exception("Health check failed while counting tables: %s", exc)
        raise HTTPException(
          status_code=503, detail="Database health check failed."
        )  # noqa: E501

    is_data_seeded = all(
        table_counts[key] > 0
        for key in (
            "elections",
            "stages",
            "deadlines",
            "glossary_items",
            "eligibility_rules",
        )
    )
    status = "healthy" if is_data_seeded else "degraded"

    return {
        "status": status,
        "database_connected": True,
        "data_seeded": is_data_seeded,
        "table_counts": table_counts,
        "observability": get_observability_status(),
    }
