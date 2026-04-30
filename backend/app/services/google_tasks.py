import base64
import json
import importlib
from functools import lru_cache
from typing import Any

from app.core.logging import get_logger
from app.core.settings import get_settings

logger = get_logger("google_tasks")
_local_task_queue: list[dict] = []


@lru_cache(maxsize=1)
def _get_tasks_module() -> Any | None:
    try:
        from google.cloud import tasks_v2 as tasks_module

        return tasks_module
    except Exception as exc:  # pragma: no cover - external runtime dependency
        try:
            return importlib.import_module("google.cloud.tasks_v2")
        except Exception:
            logger.warning("Cloud Tasks SDK unavailable: %s", exc)
            return None


@lru_cache(maxsize=1)
def _get_tasks_client():
    tasks_module = _get_tasks_module()
    if tasks_module is None:
        return None

    try:
        return tasks_module.CloudTasksClient()  # pragma: no cover
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning("Cloud Tasks client unavailable: %s", exc)
        return None


def get_local_task_queue_size() -> int:
    return len(_local_task_queue)


def is_cloud_tasks_sdk_available() -> bool:
    return _get_tasks_module() is not None


def get_cloud_tasks_runtime_status() -> dict[str, bool | str | int]:
    settings = get_settings()
    configured = bool(
        settings.google_cloud_project
        and settings.cloud_tasks_location
        and settings.cloud_tasks_queue_id
        and settings.cloud_tasks_target_url
    )
    sdk_available = is_cloud_tasks_sdk_available()
    client_available = _get_tasks_client() is not None
    ready = configured and sdk_available and client_available
    return {
        "configured": configured,
        "sdk_available": sdk_available,
        "client_available": client_available,
        "ready": ready,
        "queue_id": settings.cloud_tasks_queue_id or "",
        "target_url_configured": bool(settings.cloud_tasks_target_url),
        "verification_token_configured": bool(
            settings.cloud_tasks_verification_token
        ),
        "local_fallback_queue_size": get_local_task_queue_size(),
    }


def enqueue_json_task(
    payload: dict, queue_id: str | None = None, target_url: str | None = None
) -> tuple[str, str]:
    settings = get_settings()
    queue = queue_id or settings.cloud_tasks_queue_id
    url = target_url or settings.cloud_tasks_target_url

    client = _get_tasks_client()
    if not (
        settings.google_cloud_project
        and settings.cloud_tasks_location
        and queue
        and url
        and client
    ):
        task_name = f"local-task-{len(_local_task_queue) + 1}"
        _local_task_queue.append({"task_name": task_name, "payload": payload})
        return "local_fallback", task_name

    try:
        tasks_module = _get_tasks_module()
        if tasks_module is None:
            raise RuntimeError("Cloud Tasks SDK unavailable.")

        queue_path = client.queue_path(
            settings.google_cloud_project, settings.cloud_tasks_location, queue
        )
        http_request: dict = {
            "http_method": tasks_module.HttpMethod.POST,
            "url": url,
            "headers": {"Content-Type": "application/json"},
            "body": base64.b64encode(json.dumps(payload).encode("utf-8")),
        }
        if settings.cloud_tasks_verification_token:
            http_request["headers"]["X-Tasks-Token"] = (
                settings.cloud_tasks_verification_token
            )
        if settings.cloud_tasks_service_account:
            http_request["oidc_token"] = {
                "service_account_email": settings.cloud_tasks_service_account
            }

        task = {"http_request": http_request}
        response = client.create_task(
            request={"parent": queue_path, "task": task}
        )  # noqa: E501
        return "cloud_tasks", response.name
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning(
            "Cloud Tasks enqueue failed, using local fallback: %s", exc
        )  # noqa: E501
        task_name = f"local-task-{len(_local_task_queue) + 1}"
        _local_task_queue.append({"task_name": task_name, "payload": payload})
        return "local_fallback", task_name
