import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models import Stage, EligibilityRule, Election

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to MatdaanPath API"}

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_get_timeline(client: TestClient, session: Session):
    # Add dummy data
    election = Election(name="General Election", election_type="Lok Sabha", year=2024)
    session.add(election)
    session.commit()
    session.refresh(election)

    stage = Stage(name="Registration", description="Register to vote", sequence_order=1, election_id=election.id)
    session.add(stage)
    session.commit()
    
    response = client.get("/api/timeline/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Registration"

def test_get_eligibility_rules(client: TestClient, session: Session):
    rule = EligibilityRule(
        question="Are you 18?", 
        rule_key="age", 
        expected_value="yes", 
        explanation_if_failed="Must be 18", 
        sequence_order=1
    )
    session.add(rule)
    session.commit()
    
    response = client.get("/api/eligibility/rules")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["question"] == "Are you 18?"
