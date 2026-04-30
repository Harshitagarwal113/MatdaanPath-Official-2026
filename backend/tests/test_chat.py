from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Source
import app.api.chat as chat_api


def test_chat_endpoint_mocked(client: TestClient, session: Session):
    session.add(
        Source(
            name="ECI Official Website",
            url="https://eci.gov.in",
            source_type="government",
            status="approved",
        )
    )
    session.commit()

    with patch("app.api.chat._client") as mock_client:
        # Mock the Gemini response
        mock_response = MagicMock()
        mock_response.text = "Mocked AI Response"
        mock_client.models.generate_content.return_value = mock_response

        response = client.post("/api/chat/", json={"message": "How to vote?"})

        assert response.status_code == 200
        payload = response.json()
        assert payload["response"] == "Mocked AI Response"
        assert payload["fallback_used"] is False
        assert len(payload["sources"]) == 1
        assert payload["sources"][0]["url"] == "https://eci.gov.in"
        assert "educational" in payload["disclaimer"].lower()


def test_chat_service_not_configured(client: TestClient, session: Session):
    session.add(
        Source(
            name="Voter Service Portal",
            url="https://voters.eci.gov.in",
            source_type="portal",
            status="approved",
        )
    )
    session.commit()

    with patch("app.api.chat._client", None):
        response = client.post("/api/chat/", json={"message": "How to vote?"})
        assert response.status_code == 200
        payload = response.json()
        assert payload["fallback_used"] is True
        assert "temporarily unavailable" in payload["response"].lower()
        assert len(payload["sources"]) == 1
        assert "live ai" in payload["disclaimer"].lower()


def test_chat_rate_limit_enforced(
    client: TestClient, session: Session, monkeypatch
):  # noqa: E501
    session.add(
        Source(
            name="ECI Official Website",
            url="https://eci.gov.in",
            source_type="government",
            status="approved",
        )
    )
    session.commit()

    monkeypatch.setattr(chat_api, "CHAT_RATE_LIMIT_REQUESTS", 2)
    monkeypatch.setattr(chat_api, "CHAT_RATE_WINDOW_SECONDS", 60)
    chat_api._chat_rate_limit_window.clear()

    with patch("app.api.chat._client", None):
        first = client.post("/api/chat/", json={"message": "How to vote?"})
        second = client.post(
            "/api/chat/", json={"message": "How to register?"}
        )  # noqa: E501
        third = client.post(
            "/api/chat/", json={"message": "Where is my booth?"}
        )  # noqa: E501

    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 429
