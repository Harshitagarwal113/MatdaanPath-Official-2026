from unittest.mock import patch, MagicMock
import pytest
import time

from app.api.chat import (
    _init_client,
    _is_rate_limited,
    _prune_rate_limit_windows,
    _chat_rate_limit_window,
    _fallback_response,
    get_context_bundle,
    chat,
    ChatRequest,
)


# test _init_client permutations
@patch("app.api.chat.os.getenv")
@patch("app.api.chat.get_settings")
@patch("app.api.chat.get_secret_payload")
@patch("google.genai.Client", create=True)
def test_init_client_secret_manager(
    mock_client, mock_get_secret, mock_settings, mock_getenv
):
    mock_getenv.return_value = ""
    mock_settings.return_value.secret_manager_enabled = True
    mock_settings.return_value.google_cloud_project = "proj"
    mock_get_secret.return_value = "secret-key"
    _init_client()
    from app.api.chat import _provider

    assert _provider == "gemini_api_key"


@patch("app.api.chat.os.getenv")
@patch("app.api.chat.get_settings")
@patch("google.genai.Client", create=True)
def test_init_client_vertex_ai(mock_client, mock_settings, mock_getenv):
    mock_getenv.return_value = ""
    mock_settings.return_value.secret_manager_enabled = False
    mock_settings.return_value.google_cloud_project = "proj"
    _init_client()
    from app.api.chat import _provider

    assert _provider == "vertex_ai"


@patch("app.api.chat.os.getenv")
@patch("app.api.chat.get_settings")
def test_init_client_unconfigured(mock_settings, mock_getenv):
    mock_getenv.return_value = ""
    mock_settings.return_value.secret_manager_enabled = False
    mock_settings.return_value.google_cloud_project = ""
    _init_client()
    from app.api.chat import _provider

    assert _provider == "unconfigured"


@patch("app.api.chat.os.getenv")
@patch("app.api.chat.get_settings")
@patch("google.genai.Client", create=True)
def test_init_client_exception(mock_client, mock_settings, mock_getenv):
    mock_getenv.return_value = "key"
    mock_client.side_effect = Exception("error")
    _init_client()
    from app.api.chat import _provider

    assert _provider == "unconfigured"


def test_context_bundle_empty():
    res, sources = get_context_bundle("   ", MagicMock())
    assert res == ""
    assert isinstance(sources, list)


def test_prune_rate_limit_windows():
    _chat_rate_limit_window.clear()

    # 1. Prune timestamps
    _chat_rate_limit_window["client1"].append(10.0)
    _chat_rate_limit_window["client1"].append(20.0)
    _prune_rate_limit_windows(15.0)
    assert list(_chat_rate_limit_window["client1"]) == [20.0]

    # 2. Prune entirely empty
    _chat_rate_limit_window["client2"].append(10.0)
    _prune_rate_limit_windows(15.0)
    assert "client2" not in _chat_rate_limit_window

    # 3. Limit max clients
    _chat_rate_limit_window.clear()
    from app.api.chat import CHAT_RATE_LIMIT_MAX_CLIENTS

    for i in range(CHAT_RATE_LIMIT_MAX_CLIENTS + 5):
        _chat_rate_limit_window[f"client{i}"].append(100.0)

    _prune_rate_limit_windows(50.0)
    assert len(_chat_rate_limit_window) == CHAT_RATE_LIMIT_MAX_CLIENTS


def test_fallback_response_with_context():
    context = "Line 1\nLine 2\nLine 3\nLine 4"
    res = _fallback_response(context)
    assert "Line 1 Line 2 Line 3" in res


@pytest.mark.asyncio
@patch("app.api.chat._client")
@patch("app.api.chat.get_context_bundle")
@patch("app.api.chat.report_exception")
async def test_chat_exceptions(mock_report, mock_context, mock_client):
    mock_context.return_value = ("ctx", [])
    request = ChatRequest(message="hello")
    http_request = MagicMock()
    http_request.client.host = "test-host"

    # Reset rate limit
    _chat_rate_limit_window.clear()

    # 403 Permission Denied
    mock_client.models.generate_content.side_effect = Exception(
        "403 Permission denied"
    )  # noqa: E501
    res = await chat(request, http_request, MagicMock())
    assert "denied access" in res.response
    assert res.fallback_used

    # 429 Quota
    mock_client.models.generate_content.side_effect = Exception(
        "429 RESOURCE_EXHAUSTED"
    )
    res = await chat(request, http_request, MagicMock())
    assert "quota is currently exhausted" in res.response

    # 401 Invalid Key
    mock_client.models.generate_content.side_effect = Exception(
        "401 API_KEY_INVALID"
    )  # noqa: E501
    res = await chat(request, http_request, MagicMock())
    assert "API key appears invalid" in res.response

    # Rate limiting while loop
    now = time.monotonic()
    from app.api.chat import CHAT_RATE_LIMIT_REQUESTS

    _chat_rate_limit_window["test-host"].extend(
        [now - 100, now - 100, now]
    )  # old timestamps
    assert not _is_rate_limited("test-host")  # should pop old ones

    # Hit rate limit
    _chat_rate_limit_window["test-host"].clear()
    for _ in range(CHAT_RATE_LIMIT_REQUESTS):
        _is_rate_limited("test-host")
    assert _is_rate_limited("test-host")
