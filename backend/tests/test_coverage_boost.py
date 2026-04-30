from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.timeline import get_deadlines, get_timeline
from app.main import (
    _cache_control_for_path,
    _get_allowed_origins,
    detailed_health_check,
    lifespan,
)
from app.services.google_auth import (
    _ensure_firebase_app,
    verify_firebase_token,
)  # noqa: E501
from app.services.google_secret_manager import get_secret_payload
from app.services.google_tasks import enqueue_json_task


def test_get_allowed_origins_from_env(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "http://a.com, http://b.com ")
    assert _get_allowed_origins() == ["http://a.com", "http://b.com"]


def test_cache_control_map():
    assert _cache_control_for_path("/api/chat/ask") == "no-store"
    assert _cache_control_for_path("/health") == "no-store"
    assert (
        _cache_control_for_path("/api/google-services/status")
        == "private, max-age=30"  # noqa: E501
    )
    assert _cache_control_for_path("/api/deadlines/") == "public, max-age=120"
    assert _cache_control_for_path("/") == ""


@pytest.mark.asyncio
async def test_lifespan_context_manager_runs():
    async with lifespan(None):
        pass


@patch("app.main.get_table_counts")
def test_detailed_health_check_raises_503_when_table_count_fails(
    mock_get_counts,
):  # noqa: E501
    mock_get_counts.side_effect = Exception("database down")
    with pytest.raises(HTTPException) as exc_info:
        detailed_health_check(session=MagicMock())
    assert exc_info.value.status_code == 503


def test_firebase_auth_returns_none_without_sdk():
    _ensure_firebase_app.cache_clear()
    with patch.dict("sys.modules", {"firebase_admin": None}):
        assert _ensure_firebase_app() is None


def test_verify_firebase_token_returns_none_for_empty_token():
    assert verify_firebase_token("") is None


@patch("app.services.google_secret_manager.get_settings")
def test_get_secret_payload_returns_none_without_project(mock_get_settings):
    mock_get_settings.return_value.google_cloud_project = ""
    assert get_secret_payload("any-secret") is None


@patch("app.services.google_secret_manager.get_settings")
@patch("app.services.google_secret_manager._get_secret_manager_client")
def test_get_secret_payload_success(mock_get_client, mock_get_settings):
    mock_get_settings.return_value.google_cloud_project = "proj-1"
    mock_response = MagicMock()
    mock_response.payload.data.decode.return_value = " secret-value "
    mock_client_instance = MagicMock()
    mock_client_instance.access_secret_version.return_value = mock_response
    mock_get_client.return_value = mock_client_instance

    assert get_secret_payload("secret-name") == "secret-value"


def test_enqueue_json_task_uses_local_fallback_when_not_configured():
    provider, task_name = enqueue_json_task(
        {"hello": "world"}, queue_id="", target_url=""
    )
    assert provider == "local_fallback"
    assert task_name.startswith("local-task-")


@patch("app.services.google_tasks.get_settings")
@patch("app.services.google_tasks._get_tasks_client")
@patch("app.services.google_tasks._get_tasks_module")
def test_enqueue_json_task_cloud_tasks_success(
    mock_get_module,
    mock_get_client,
    mock_get_settings,
):  # noqa: E501
    from app.services.google_tasks import _get_tasks_client, _get_tasks_module
    _get_tasks_client.cache_clear()
    _get_tasks_module.cache_clear()

    mock_get_settings.return_value.google_cloud_project = "project-id"
    mock_get_settings.return_value.cloud_tasks_location = "asia-south1"
    mock_get_settings.return_value.cloud_tasks_queue_id = "queue-id"
    mock_get_settings.return_value.cloud_tasks_target_url = (
        "https://example.com/task"  # noqa: E501
    )
    mock_get_settings.return_value.cloud_tasks_verification_token = "token"
    mock_get_settings.return_value.cloud_tasks_service_account = (
        "svc@example.com"  # noqa: E501
    )

    mock_client = MagicMock()
    mock_client.queue_path.return_value = (
        "projects/project-id/locations/asia-south1/queues/queue-id"
    )
    mock_response = MagicMock()
    mock_response.name = "task-123"
    mock_client.create_task.return_value = mock_response
    mock_get_client.return_value = mock_client

    fake_tasks_module = SimpleNamespace(HttpMethod=SimpleNamespace(POST="POST"))  # noqa: E501
    mock_get_module.return_value = fake_tasks_module
    provider, task_name = enqueue_json_task({"k": "v"})

    assert provider == "cloud_tasks"
    assert task_name == "task-123"


def test_get_timeline_raises_404_when_election_missing():
    session = MagicMock()
    session.get.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        get_timeline(1, session)
    assert exc_info.value.status_code == 404


def test_get_deadlines_raises_404_when_election_missing():
    session = MagicMock()
    session.get.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        get_deadlines(1, session)
    assert exc_info.value.status_code == 404
