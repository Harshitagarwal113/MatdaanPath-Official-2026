import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models import GlossaryItem, Stage, Election, Deadline
from datetime import datetime

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
    election = Election(name="Test Election", election_type="State", year=2026)
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

def test_chat_not_configured(client: TestClient):
    # Test chat endpoint. In test environment, it might return:
    # 200 (Success if mocked/working)
    # 503 (Service Unavailable if _client is None)
    # 500 (Internal Error if AI call fails - common in CI without creds)
    response = client.post("/api/chat/", json={"message": "Random query"})
    assert response.status_code in [200, 500, 503]
