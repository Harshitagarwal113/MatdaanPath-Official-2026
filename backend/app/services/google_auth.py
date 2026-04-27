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

    if firebase_admin._apps:  # type: ignore[attr-defined]
        return firebase_admin.get_app()

    try:
        if settings.firebase_service_account_json:
            parsed_credentials = json.loads(settings.firebase_service_account_json)
            credential = credentials.Certificate(parsed_credentials)
            return firebase_admin.initialize_app(credential)

        if settings.firebase_project_id:
            return firebase_admin.initialize_app(
                options={"projectId": settings.firebase_project_id},
            )

        if settings.google_cloud_project:
            return firebase_admin.initialize_app(
                options={"projectId": settings.google_cloud_project},
            )
    except Exception as exc:  # pragma: no cover - external runtime dependency
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
