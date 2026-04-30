import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.core.database import get_session
from app.core.auth import require_admin, RequestIdentity

def override_require_admin():
    return RequestIdentity(user_id="test-admin", is_admin=True, auth_provider="test")

@pytest.fixture(name="admin_client")
def admin_client_fixture(client: TestClient):
    app.dependency_overrides[require_admin] = override_require_admin
    yield client
    app.dependency_overrides.pop(require_admin, None)

def test_get_admin_identity(admin_client: TestClient):
    response = admin_client.get("/api/admin/me")
    assert response.status_code == 200
    assert response.json()["user_id"] == "test-admin"

def test_glossary_crud(admin_client: TestClient):
    response = admin_client.post("/api/admin/glossary", json={
        "term": "Test Term",
        "definition": "Test Definition that is long enough",
        "category": "Test Category"
    })
    assert response.status_code == 200
    item_id = response.json()["id"]

    response = admin_client.put(f"/api/admin/glossary/{item_id}", json={
        "term": "Updated Term",
        "definition": "Updated Definition that is long enough",
        "category": "Test Category"
    })
    assert response.status_code == 200
    assert response.json()["term"] == "Updated Term"

    response = admin_client.delete(f"/api/admin/glossary/{item_id}")
    assert response.status_code == 200

def test_source_crud(admin_client: TestClient):
    response = admin_client.post("/api/admin/sources", json={
        "name": "Test Source",
        "url": "https://test.com",
        "source_type": "web"
    })
    assert response.status_code == 200
    source_id = response.json()["id"]

    response = admin_client.put(f"/api/admin/sources/{source_id}", json={
        "name": "Updated Source",
        "url": "https://test.com/updated",
        "source_type": "web"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Source"

def test_eligibility_rule_crud(admin_client: TestClient):
    response = admin_client.post("/api/admin/eligibility-rules", json={
        "question": "Are you 18?",
        "rule_key": "age",
        "expected_value": "yes",
        "explanation_if_failed": "You must be 18 to vote.",
        "sequence_order": 1
    })
    assert response.status_code == 200
    rule_id = response.json()["id"]

    response = admin_client.put(f"/api/admin/eligibility-rules/{rule_id}", json={
        "question": "Are you 18 or older?",
        "rule_key": "age",
        "expected_value": "yes",
        "explanation_if_failed": "You must be 18 or older to vote.",
        "sequence_order": 1
    })
    assert response.status_code == 200
    assert response.json()["question"] == "Are you 18 or older?"

def test_stage_crud(admin_client: TestClient):
    response = admin_client.post("/api/admin/stages", json={
        "name": "Test Stage",
        "description": "Test stage description",
        "sequence_order": 1
    })
    assert response.status_code == 200
    stage_id = response.json()["id"]

    response = admin_client.put(f"/api/admin/stages/{stage_id}", json={
        "name": "Updated Stage",
        "description": "Updated stage description",
        "sequence_order": 2
    })
    assert response.status_code == 200
    assert response.json()["sequence_order"] == 2

def test_deadline_crud(admin_client: TestClient):
    response = admin_client.post("/api/admin/deadlines", json={
        "name": "Test Deadline",
        "date": "2026-01-01T00:00:00Z",
        "description": "Test deadline description"
    })
    assert response.status_code == 200
    deadline_id = response.json()["id"]

    response = admin_client.put(f"/api/admin/deadlines/{deadline_id}", json={
        "name": "Updated Deadline",
        "date": "2026-01-02T00:00:00Z",
        "description": "Updated deadline description"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Deadline"
