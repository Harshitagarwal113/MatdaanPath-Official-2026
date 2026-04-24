from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

def test_chat_endpoint_mocked(client: TestClient):
    with patch("app.api.chat._client") as mock_client:
        # Mock the Gemini response
        mock_response = MagicMock()
        mock_response.text = "Mocked AI Response"
        mock_client.models.generate_content.return_value = mock_response
        
        response = client.post("/api/chat/", json={"message": "How to vote?"})
        
        assert response.status_code == 200
        assert response.json()["response"] == "Mocked AI Response"

def test_chat_service_not_configured(client: TestClient):
    with patch("app.api.chat._client", None):
        response = client.post("/api/chat/", json={"message": "How to vote?"})
        assert response.status_code == 503
        assert "not configured" in response.json()["detail"]
