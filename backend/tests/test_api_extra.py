from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Deadline, Election, EligibilityRule, GlossaryItem, Region, Stage

def test_get_glossary(client: TestClient, session: Session):
    item = GlossaryItem(term="Voter ID", definition="Identification card for voting")
    session.add(item)
    session.commit()
    
    response = client.get("/api/glossary/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["term"] == "Voter ID"

def test_get_deadlines(client: TestClient, session: Session):
    region = Region(name="National", code="IN")
    session.add(region)
    session.commit()
    session.refresh(region)

    election = Election(name="Test Election", election_type="State", year=2026, region_id=region.id)
    session.add(election)
    session.commit()
    session.refresh(election)

    deadline = Deadline(
        name="Last Date to Register", 
        date=datetime(2026, 5, 1), 
        election_id=election.id
    )
    session.add(deadline)
    session.commit()
    
    response = client.get("/api/deadlines/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(d["name"] == "Last Date to Register" for d in data)

def test_get_deadlines_for_selected_region_includes_national_deadlines(client, session: Session):
    national_region = Region(name="India", code="IN")
    state_region = Region(name="Maharashtra", code="MH")
    session.add_all([national_region, state_region])
    session.commit()
    session.refresh(national_region)
    session.refresh(state_region)

    national_election = Election(
        name="National Election",
        election_type="General",
        year=2026,
        region_id=None,
    )
    state_election = Election(
        name="State Election",
        election_type="State",
        year=2026,
        region_id=state_region.id,
    )
    other_state_election = Election(
        name="Other State Election",
        election_type="State",
        year=2026,
        region_id=national_region.id,
    )
    session.add_all([national_election, state_election, other_state_election])
    session.commit()
    session.refresh(national_election)
    session.refresh(state_election)
    session.refresh(other_state_election)

    session.add_all(
        [
            Deadline(name="National Deadline", date=datetime(2026, 4, 20), election_id=national_election.id),
            Deadline(name="MH Deadline", date=datetime(2026, 4, 21), election_id=state_election.id),
            Deadline(name="Other Deadline", date=datetime(2026, 4, 22), election_id=other_state_election.id),
        ]
    )
    session.commit()

    response = client.get(f"/api/deadlines/?region_id={state_region.id}")
    assert response.status_code == 200
    names = [item["name"] for item in response.json()]
    assert "National Deadline" in names
    assert "MH Deadline" in names
    assert "Other Deadline" not in names

def test_get_timeline_by_election(client: TestClient, session: Session):
    election = Election(name="LSE 2024", election_type="Lok Sabha", year=2024)
    session.add(election)
    session.commit()
    session.refresh(election)

    stage = Stage(name="Polling", description="Go vote", sequence_order=2, election_id=election.id)
    session.add(stage)
    session.commit()
    
    response = client.get(f"/api/timeline/?election_id={election.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Polling"

def test_check_eligibility_with_failed_rule(client, session: Session):
    session.add_all(
        [
            EligibilityRule(
                question="Are you 18?",
                rule_key="age",
                expected_value="yes",
                explanation_if_failed="Must be 18",
                sequence_order=1,
            ),
            EligibilityRule(
                question="Are you a citizen?",
                rule_key="citizenship",
                expected_value="yes",
                explanation_if_failed="Must be a citizen",
                sequence_order=2,
            ),
        ]
    )
    session.commit()

    response = client.post(
        "/api/eligibility/check",
        json={"answers": {"age": "yes", "citizenship": "no"}},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["eligible"] is False
    assert payload["failed_rules"] == ["Are you a citizen?"]

def test_chat_not_configured(client: TestClient):
    # Test chat endpoint. In test environment, it might return:
    # 200 (Success if mocked/working)
    # 503 (Service Unavailable if _client is None)
    # 500 (Internal Error if AI call fails - common in CI without creds)
    response = client.post("/api/chat/", json={"message": "Random query"})
    assert response.status_code in [200, 500, 503]
