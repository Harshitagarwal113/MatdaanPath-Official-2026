from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Source


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
