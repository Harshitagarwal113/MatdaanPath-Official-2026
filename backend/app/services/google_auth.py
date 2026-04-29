import json
from functools import lru_cache

from app.core.logging import get_logger
from app.core.settings import get_settings

logger = get_logger("google_auth")


@lru_cache(maxsize=1)
def _ensure_firebase_app():
    settings = get_settings()

    try:
        import firebase_admin
        from firebase_admin import credentials
    except Exception as exc:  # pragma: no cover - optional dependency
        logger.warning("Firebase Admin SDK unavailable: %s", exc)
        return None

    try:
        from firebase_admin import _apps, get_app, initialize_app
    except ImportError:
        return None

    if _apps:
        return get_app()

    try:
        if settings.firebase_service_account_json:
            from firebase_admin import credentials
            parsed_credentials = json.loads(settings.firebase_service_account_json)
            credential = credentials.Certificate(parsed_credentials)
            return initialize_app(credential)

        if settings.firebase_project_id:
            return initialize_app(options={"projectId": settings.firebase_project_id})

        if settings.google_cloud_project:
            return initialize_app(options={"projectId": settings.google_cloud_project})
    except ValueError as exc:
        # This handles the "The default Firebase app already exists" case
        if "already exists" in str(exc):
            return get_app()
        logger.warning("Firebase app initialization failed: %s", exc)
        return None
    except Exception as exc:
        logger.warning("Firebase app initialization failed: %s", exc)
        return None

    return None


def is_firebase_auth_enabled() -> bool:
    return _ensure_firebase_app() is not None


def verify_firebase_token(id_token: str) -> dict | None:
    app = _ensure_firebase_app()
    if app is None or not id_token:
        return None

    try:
        from firebase_admin import auth

        return auth.verify_id_token(id_token, app=app)
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning("Firebase token verification failed: %s", exc)
        return None
