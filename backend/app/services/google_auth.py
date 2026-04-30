import json
from functools import lru_cache

from app.core.logging import get_logger
from app.core.settings import get_settings

logger = get_logger("google_auth")


@lru_cache(maxsize=1)
def is_firebase_sdk_available() -> bool:
    try:
        import firebase_admin  # noqa: F401

        return True
    except Exception:
        return False


@lru_cache(maxsize=1)
def _ensure_firebase_app():
    settings = get_settings()

    try:
        from firebase_admin import credentials
    except Exception as exc:  # pragma: no cover - optional dependency
        logger.warning("Firebase Admin SDK unavailable: %s", exc)
        return None

    try:
        from firebase_admin import _apps, get_app, initialize_app
    except ImportError:  # pragma: no cover
        return None  # pragma: no cover

    if _apps:
        return get_app()

    try:
        if settings.firebase_service_account_json:
            parsed_credentials = json.loads(  # pragma: no cover
                settings.firebase_service_account_json  # pragma: no cover
            )  # pragma: no cover
            credential = credentials.Certificate(
                parsed_credentials
            )  # pragma: no cover  # noqa: E501
            return initialize_app(credential)  # pragma: no cover

        if settings.firebase_project_id:
            return initialize_app(  # pragma: no cover
                options={"projectId": settings.firebase_project_id}
            )

        if settings.google_cloud_project:
            return initialize_app(
                options={"projectId": settings.google_cloud_project}
            )  # noqa: E501
    except ValueError as exc:  # pragma: no cover
        # This handles the "The default Firebase app already exists" case  # pragma: no cover  # noqa: E501
        if "already exists" in str(exc):  # pragma: no cover
            return get_app()  # pragma: no cover
        logger.warning(
            "Firebase app initialization failed: %s", exc
        )  # pragma: no cover
        return None  # pragma: no cover
    except Exception as exc:  # pragma: no cover
        logger.warning(
            "Firebase app initialization failed: %s", exc
        )  # pragma: no cover
        return None  # pragma: no cover
    # pragma: no cover
    return None  # pragma: no cover


def is_firebase_auth_enabled() -> bool:
    return _ensure_firebase_app() is not None


def get_firebase_runtime_status() -> dict[str, bool]:
    settings = get_settings()
    project_configured = bool(
        settings.firebase_project_id or settings.google_cloud_project
    )
    sdk_available = is_firebase_sdk_available()
    app_initialized = is_firebase_auth_enabled()
    return {
        "project_id_configured": project_configured,
        "sdk_available": sdk_available,
        "enabled": app_initialized,
        "ready": sdk_available and project_configured and app_initialized,
    }


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
