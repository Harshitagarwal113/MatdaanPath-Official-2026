from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session
from app.core.cache import clear_cache
from app.models import Deadline, Election, EligibilityRule, GlossaryItem, Region, Stage

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to MatdaanPath API"}

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_detailed_health_check_reports_seed_state(client: TestClient, session: Session):
    response = client.get("/health/detailed")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "degraded"
    assert payload["data_seeded"] is False

    region = Region(name="India", code="IN")
    session.add(region)
    session.commit()
    session.refresh(region)

    election = Election(name="General Election", election_type="Lok Sabha", year=2024, region_id=region.id)
    session.add(election)
    session.commit()
    session.refresh(election)

    session.add(Stage(name="Registration", description="Register to vote", sequence_order=1, election_id=election.id))
    session.add(Deadline(name="Registration deadline", date=datetime(2026, 5, 1), election_id=election.id))
    session.add(GlossaryItem(term="EVM", definition="Electronic Voting Machine"))
    session.add(
        EligibilityRule(
            question="Are you 18?",
            rule_key="age",
            expected_value="yes",
            explanation_if_failed="Must be 18",
            sequence_order=1,
        )
    )
    session.commit()

    response_after_seed = client.get("/health/detailed")
    assert response_after_seed.status_code == 200
    payload_after_seed = response_after_seed.json()
    assert payload_after_seed["status"] == "healthy"
    assert payload_after_seed["data_seeded"] is True
    assert payload_after_seed["table_counts"]["stages"] >= 1
    assert payload_after_seed["table_counts"]["deadlines"] >= 1
    assert "cloud_logging_enabled" in payload_after_seed["observability"]

def test_get_timeline(client: TestClient, session: Session):
    clear_cache(prefix="timeline:")

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
    assert data[0]["requirement_description"] == "Must be 18"


def test_cache_control_headers_for_read_apis(client: TestClient):
    clear_cache(prefix="timeline:")

    timeline_response = client.get("/api/timeline/")
    assert timeline_response.status_code == 200
    assert timeline_response.headers["Cache-Control"] == "public, max-age=120"

    health_response = client.get("/health")
    assert health_response.status_code == 200
    assert health_response.headers["Cache-Control"] == "no-store"
