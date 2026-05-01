"""
API implementation for monitoring and status checks of Google Cloud Services.
Validates connectivity and configuration for Gemini, Firebase, Cloud Tasks, etc.
"""
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.api.chat import get_chat_service_status
from app.core.logging import get_observability_status
from app.core.settings import get_settings
from app.services.google_auth import get_firebase_runtime_status
from app.services.google_secret_manager import (
    get_secret_manager_runtime_status,
)
from app.services.google_tasks import get_cloud_tasks_runtime_status

router = APIRouter()


class GoogleServicesStatusResponse(BaseModel):
    """Schema for the comprehensive Google Cloud services status report."""
    google_cloud_project: str | None
    cloud_run_service: str | None
    cloud_run_revision: str | None
    deployment_mode: str
    ready_for_cloud_run: bool
    blocking_issues: list[str] = Field(default_factory=list)
    observability: dict[str, bool]
    gemini: dict[str, str | bool]
    firebase_auth: dict[str, bool]
    cloud_tasks: dict[str, str | bool | int]
    secret_manager: dict[str, bool]
    admin_auth: dict[str, str | bool]
    updated_at: str


def _compute_blocking_issues(
    *,
    gemini_status: dict[str, str | bool],
    firebase_status: dict[str, bool],
    tasks_status: dict[str, str | bool | int],
    secret_status: dict[str, bool],
    observability_status: dict[str, bool],
) -> list[str]:
    """Analyze service statuses to identify issues that prevent stable deployment."""
    issues: list[str] = []

    if not bool(gemini_status.get("ready")):
        issues.append(
            "Gemini is not ready. Configure a valid API key or Vertex AI."
        )

    if not bool(firebase_status.get("ready")):
        issues.append(
            "Firebase Auth is not ready. Confirm Admin SDK configuration."
        )

    if not bool(tasks_status.get("ready")):
        issues.append(
            "Cloud Tasks is not ready. Verify SDK, queue, and target URL."
        )

    if not bool(secret_status.get("ready")):
        issues.append(
            "Secret Manager is not ready. Verify SDK and GEMINI_API_KEY_SECRET."
        )

    if not observability_status.get("cloud_logging_enabled", False):
        issues.append(
            "Cloud Logging is not enabled. Verify project ID and IAM."
        )

    if not observability_status.get("error_reporting_enabled", False):
        issues.append(
            "Error Reporting is not enabled. Verify Cloud Error permissions."
        )

    return issues


@router.get("/status", response_model=GoogleServicesStatusResponse)
def get_google_services_status(
    include_observability_issues: bool = Query(
        default=True,
        description="Include Logging/Error Reporting as blockers.",
    ),
):
    """Retrieve the current health and configuration of all integrated Google Cloud services."""
    settings = get_settings()
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip() or None
    cloud_run_service = os.getenv("K_SERVICE", "").strip() or None
    cloud_run_revision = os.getenv("K_REVISION", "").strip() or None
    deployment_mode = "cloud_run" if cloud_run_service else "local"

    observability_status = get_observability_status()
    gemini_status = get_chat_service_status()
    firebase_status = get_firebase_runtime_status()
    tasks_status = get_cloud_tasks_runtime_status()
    secret_status = get_secret_manager_runtime_status()

    blocking_issues = _compute_blocking_issues(
        gemini_status=gemini_status,
        firebase_status=firebase_status,
        tasks_status=tasks_status,
        secret_status=secret_status,
        observability_status=observability_status,
    )
    if not include_observability_issues:
        blocking_issues = [
            issue
            for issue in blocking_issues
            if "Cloud Logging" not in issue and "Error Reporting" not in issue
        ]

    return GoogleServicesStatusResponse(
        google_cloud_project=project_id,
        cloud_run_service=cloud_run_service,
        cloud_run_revision=cloud_run_revision,
        deployment_mode=deployment_mode,
        ready_for_cloud_run=len(blocking_issues) == 0,
        blocking_issues=blocking_issues,
        observability=observability_status,
        gemini=gemini_status,
        firebase_auth=firebase_status,
        cloud_tasks=tasks_status,
        secret_manager=secret_status,
        admin_auth={
            "configured": settings.admin_auth_configured,
            "allow_insecure_admin": settings.allow_insecure_admin,
        },
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
