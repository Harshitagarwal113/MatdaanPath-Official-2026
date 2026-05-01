import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_timeline_list():
    """Test retrieving the list of all elections for the timeline."""
    response = client.get("/api/timeline/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_election_detail_not_found():
    """Test retrieving a non-existent election."""
    response = client.get("/api/timeline/99999")
    assert response.status_code == 404

def test_get_election_detail_success():
    """Test retrieving details for a specific election."""
    # Assuming at least one election exists from seeding
    # First get a list to find an ID
    list_response = client.get("/api/timeline/")
    if list_response.status_code == 200 and len(list_response.json()) > 0:
        election_id = list_response.json()[0]["id"]
        detail_response = client.get(f"/api/timeline/{election_id}")
        assert detail_response.status_code == 200
        assert "stages" in detail_response.json()
        assert "deadlines" in detail_response.json()
