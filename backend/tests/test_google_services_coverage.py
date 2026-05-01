import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_google_services_status_basic():
    """Test retrieving the Google services status report."""
    response = client.get("/api/google-services/status")
    assert response.status_code == 200
    data = response.json()
    assert "ready_for_cloud_run" in data
    assert "blocking_issues" in data
    assert "updated_at" in data

def test_google_services_status_no_observability():
    """Test status report excluding observability issues."""
    response = client.get("/api/google-services/status?include_observability_issues=false")
    assert response.status_code == 200
    data = response.json()
    # Ensure no observability issues are present in blocking_issues
    for issue in data["blocking_issues"]:
        assert "Logging" not in issue
        assert "Error Reporting" not in issue
