import base64
import json
from functools import lru_cache

from app.core.logging import get_logger
from app.core.settings import get_settings

logger = get_logger("google_tasks")
_local_task_queue: list[dict] = []


@lru_cache(maxsize=1)
def _get_tasks_client():
    try:
        from google.cloud import tasks_v2

        return tasks_v2.CloudTasksClient()
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning("Cloud Tasks client unavailable: %s", exc)
        return None


def get_local_task_queue_size() -> int:
    return len(_local_task_queue)


def enqueue_json_task(payload: dict, queue_id: str | None = None, target_url: str | None = None) -> tuple[str, str]:
    settings = get_settings()
    queue = queue_id or settings.cloud_tasks_queue_id
    url = target_url or settings.cloud_tasks_target_url

    client = _get_tasks_client()
    if not (settings.google_cloud_project and settings.cloud_tasks_location and queue and url and client):
        task_name = f"local-task-{len(_local_task_queue) + 1}"
        _local_task_queue.append({"task_name": task_name, "payload": payload})
        return "local_fallback", task_name

    try:
        from google.cloud import tasks_v2

        queue_path = client.queue_path(settings.google_cloud_project, settings.cloud_tasks_location, queue)
        http_request: dict = {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": url,
            "headers": {"Content-Type": "application/json"},
            "body": base64.b64encode(json.dumps(payload).encode("utf-8")),
        }
        if settings.cloud_tasks_verification_token:
            http_request["headers"]["X-Tasks-Token"] = settings.cloud_tasks_verification_token
        if settings.cloud_tasks_service_account:
            http_request["oidc_token"] = {"service_account_email": settings.cloud_tasks_service_account}

        task = {"http_request": http_request}
        response = client.create_task(request={"parent": queue_path, "task": task})
        return "cloud_tasks", response.name
    except Exception as exc:  # pragma: no cover - external runtime dependency
        logger.warning("Cloud Tasks enqueue failed, using local fallback: %s", exc)
        task_name = f"local-task-{len(_local_task_queue) + 1}"
        _local_task_queue.append({"task_name": task_name, "payload": payload})
        return "local_fallback", task_name
