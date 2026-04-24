from contextlib import asynccontextmanager
import os
import sys

# Ensure the parent directory (which contains the 'app' package) is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import setup_logging, get_logger

load_dotenv(override=True)
setup_logging()
logger = get_logger("matdaanpath")

from app.api.timeline import router as timeline_router
from app.api.eligibility import router as eligibility_router
from app.api.glossary import router as glossary_router
from app.api.deadlines import router as deadlines_router
from app.api.chat import router as chat_router


def _get_allowed_origins() -> list[str]:
    configured_origins = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if configured_origins:
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        return response


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("MatdaanPath API starting up...")
    yield

app = FastAPI(
    title="MatdaanPath API",
    description="Backend API for the Election Process Education Assistant",
    version="1.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type"],
)
app.add_middleware(SecurityHeadersMiddleware)


app.include_router(timeline_router, prefix="/api/timeline", tags=["Timeline"])
app.include_router(eligibility_router, prefix="/api/eligibility", tags=["Eligibility"])
app.include_router(glossary_router, prefix="/api/glossary", tags=["Glossary"])
app.include_router(deadlines_router, prefix="/api/deadlines", tags=["Deadlines"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])



@app.get("/")
def read_root():
    return {"message": "Welcome to MatdaanPath API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
