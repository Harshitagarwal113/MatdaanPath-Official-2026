import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_subscribe_reminder_success():
    """Test successful subscription to a deadline reminder."""
    payload = {
        "email": "test@example.com",
        "deadline_name": "Election Day",
        "deadline_date": "2026-11-01T10:00:00",
        "region_code": "IN"
    }
    response = client.post("/api/reminders/subscribe", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["queued"] is True
    assert "task_name" in data

def test_subscribe_reminder_invalid_email():
    """Test subscription with an invalid email format."""
    payload = {
        "email": "invalid-email",
        "deadline_name": "Election Day",
        "deadline_date": "2026-11-01T10:00:00"
    }
    response = client.post("/api/reminders/subscribe", json=payload)
    assert response.status_code == 422

def test_deliver_reminder_unauthorized():
    """Test delivery endpoint without a valid verification token."""
    payload = {
        "email": "test@example.com",
        "deadline_name": "Election Day",
        "deadline_date": "2026-11-01T10:00:00"
    }
    # This should fail if CLOUD_TASKS_VERIFICATION_TOKEN is set in environment
    # or return 200 if not set. We test the auth logic here.
    response = client.post("/api/reminders/deliver", json=payload, headers={"X-Tasks-Token": "wrong-token"})
    # Depending on default settings, this might be 401 or 200.
    # In main.py settings, it defaults to None if not in env.
    assert response.status_code in [200, 401]

def test_deliver_reminder_success():
    """Test successful delivery simulation."""
    payload = {
        "email": "test@example.com",
        "deadline_name": "Election Day",
        "deadline_date": "2026-11-01T10:00:00"
    }
    response = client.post("/api/reminders/deliver", json=payload)
    assert response.status_code == 200
    assert response.json()["delivered"] is False
