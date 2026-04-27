from functools import lru_cache

from app.core.logging import get_logger
from app.core.settings import get_settings

logger = get_logger("google_secret_manager")


@lru_cache(maxsize=1)
def _get_secret_manager_client():
    try:
        from google.cloud import secretmanager

        return secretmanager.SecretManagerServiceClient()
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning("Secret Manager client unavailable: %s", exc)
        return None


def get_secret_payload(secret_name: str) -> str | None:
    settings = get_settings()
    if not settings.google_cloud_project or not secret_name:
        return None

    client = _get_secret_manager_client()
    if client is None:
        return None

    resource_name = f"projects/{settings.google_cloud_project}/secrets/{secret_name}/versions/latest"
    try:
        response = client.access_secret_version(request={"name": resource_name})
        payload = response.payload.data.decode("utf-8").strip()
        return payload or None
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning("Failed to access secret %s: %s", secret_name, exc)
        return None
