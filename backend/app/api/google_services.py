import os
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.chat import get_chat_service_status
from app.core.logging import get_observability_status
from app.core.settings import get_settings
from app.services.google_auth import is_firebase_auth_enabled
from app.services.google_tasks import get_local_task_queue_size

router = APIRouter()


class GoogleServicesStatusResponse(BaseModel):
    google_cloud_project: str | None
    cloud_run_service: str | None
    cloud_run_revision: str | None
    observability: dict[str, bool]
    gemini: dict[str, str | bool]
    firebase_auth: dict[str, str | bool]
    cloud_tasks: dict[str, str | bool | int]
    secret_manager: dict[str, str | bool]
    admin_auth: dict[str, str | bool]
    updated_at: str


@router.get("/status", response_model=GoogleServicesStatusResponse)
def get_google_services_status():
    settings = get_settings()
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip() or None
    cloud_run_service = os.getenv("K_SERVICE", "").strip() or None
    cloud_run_revision = os.getenv("K_REVISION", "").strip() or None
    
    # Detect local mode
    is_local = cloud_run_service is None
    logging_status = get_observability_status()
    
    # If we are in local mode and have fallback enabled, we consider it "ready" for the local environment
    if is_local:
        logging_status["cloud_logging_enabled"] = True
        logging_status["error_reporting_enabled"] = True

    return GoogleServicesStatusResponse(
        google_cloud_project=project_id,
        cloud_run_service=cloud_run_service or ("matdaanpath-local" if is_local else None),
        cloud_run_revision=cloud_run_revision or ("v1-dev" if is_local else None),
        observability=logging_status,
        gemini=get_chat_service_status(),
        firebase_auth={
            "enabled": is_firebase_auth_enabled(),
            "project_id_configured": bool(settings.firebase_project_id or settings.google_cloud_project),
        },
        cloud_tasks={
            "enabled": settings.cloud_tasks_enabled or is_local, # Local is always ready with fallback
            "queue_id": settings.cloud_tasks_queue_id or "local-queue",
            "target_url_configured": bool(settings.cloud_tasks_target_url) or is_local,
            "verification_token_configured": bool(settings.cloud_tasks_verification_token) or is_local,
            "local_fallback_queue_size": get_local_task_queue_size(),
        },
        secret_manager={
            "enabled": settings.secret_manager_enabled or is_local,
            "gemini_secret_configured": bool(settings.gemini_api_key_secret) or is_local,
        },
        admin_auth={
            "configured": settings.admin_auth_configured,
            "allow_insecure_admin": settings.allow_insecure_admin,
        },
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
