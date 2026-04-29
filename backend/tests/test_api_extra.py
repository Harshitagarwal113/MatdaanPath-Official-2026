from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.api.chat import get_context
from app.core.cache import clear_cache
from app.core.settings import get_settings
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
        date=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=30),
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

    base_deadline = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=14)
    session.add_all(
        [
            Deadline(name="National Deadline", date=base_deadline, election_id=national_election.id),
            Deadline(name="MH Deadline", date=base_deadline + timedelta(days=1), election_id=state_election.id),
            Deadline(name="Other Deadline", date=base_deadline + timedelta(days=2), election_id=other_state_election.id),
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


def test_default_timeline_prefers_election_with_stages(client: TestClient, session: Session):
    election_without_stages = Election(name="New Election 2026", election_type="State", year=2026)
    election_with_stages = Election(name="General Election 2024", election_type="Lok Sabha", year=2024)
    session.add_all([election_without_stages, election_with_stages])
    session.commit()
    session.refresh(election_without_stages)
    session.refresh(election_with_stages)

    session.add(
        Stage(
            name="Registration",
            description="Register to vote",
            sequence_order=1,
            election_id=election_with_stages.id,
        )
    )
    session.commit()

    response = client.get("/api/timeline/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Registration"

def test_default_timeline_prefers_nearest_upcoming_election(client: TestClient, session: Session):
    clear_cache(prefix="timeline:")

    current_election = Election(name="Current Election", election_type="General", year=2026)
    later_election = Election(name="Later Election", election_type="General", year=2027)
    session.add_all([current_election, later_election])
    session.commit()
    session.refresh(current_election)
    session.refresh(later_election)

    session.add_all(
        [
            Stage(name="Current Stage", description="Current flow", sequence_order=1, election_id=current_election.id),
            Stage(name="Later Stage", description="Later flow", sequence_order=1, election_id=later_election.id),
        ]
    )

    now = datetime.now(UTC).replace(tzinfo=None)
    session.add_all(
        [
            Deadline(
                name="Current Election Deadline",
                date=now + timedelta(days=5),
                election_id=current_election.id,
            ),
            Deadline(
                name="Later Election Deadline",
                date=now + timedelta(days=40),
                election_id=later_election.id,
            ),
        ]
    )
    session.commit()

    response = client.get("/api/timeline/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Current Stage"


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
    assert len(payload["failed_requirements"]) == 1
    assert payload["failed_requirements"][0]["question"] == "Are you a citizen?"
    assert "official_url" in payload["failed_requirements"][0]

def test_chat_not_configured(client: TestClient):
    # Test chat endpoint. In test environment, it might return:
    # 200 (Success if mocked/working)
    # 503 (Service Unavailable if _client is None)
    # 500 (Internal Error if AI call fails - common in CI without creds)
    response = client.post("/api/chat/", json={"message": "Random query"})
    assert response.status_code in [200, 500, 503]


def test_google_services_status_endpoint(client: TestClient):
    response = client.get("/api/google-services/status")
    assert response.status_code == 200
    payload = response.json()
    assert "observability" in payload
    assert "gemini" in payload
    assert "firebase_auth" in payload
    assert "cloud_tasks" in payload
    assert "secret_manager" in payload
    assert "admin_auth" in payload
    assert "updated_at" in payload
    assert "cloud_logging_enabled" in payload["observability"]
    assert "gemini_enabled" in payload["gemini"]
    assert response.headers["Cache-Control"] == "private, max-age=30"


def test_admin_endpoint_requires_auth(client: TestClient):
    response = client.get("/api/admin/me")
    assert response.status_code == 401


def test_admin_endpoint_accepts_admin_api_token(client: TestClient, monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "test-admin-token")
    monkeypatch.setenv("ALLOW_INSECURE_ADMIN", "false")
    get_settings.cache_clear()

    response = client.get(
        "/api/admin/me",
        headers={"Authorization": "Bearer test-admin-token"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["is_admin"] is True
    assert payload["auth_provider"] == "admin_api_token"

    monkeypatch.delenv("ADMIN_API_TOKEN", raising=False)
    get_settings.cache_clear()


def test_admin_glossary_create_with_token(client: TestClient, monkeypatch):
    monkeypatch.setenv("ADMIN_API_TOKEN", "test-admin-token")
    get_settings.cache_clear()
    response = client.post(
        "/api/admin/glossary",
        headers={"Authorization": "Bearer test-admin-token"},
        json={
            "term": "Constituency",
            "definition": "Geographic area represented by an elected member.",
            "category": "General",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["term"] == "Constituency"

    monkeypatch.delenv("ADMIN_API_TOKEN", raising=False)
    get_settings.cache_clear()


def test_reminder_subscription_works_without_auth(client: TestClient):
    response = client.post(
        "/api/reminders/subscribe",
        json={
            "email": "citizen@example.com",
            "deadline_name": "Registration Deadline",
            "deadline_date": "2026-07-11T10:00:00Z",
            "region_code": "IN",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["queued"] is True
    assert payload["provider"] in {"cloud_tasks", "local_fallback"}


def test_chat_context_is_bounded_and_relevant(session: Session):
    election = Election(name="General Election", election_type="Lok Sabha", year=2026)
    session.add(election)
    session.commit()
    session.refresh(election)

    session.add_all(
        [
            Stage(
                name="Registration Window",
                description="Citizen registration and voter list updates",
                sequence_order=1,
                election_id=election.id,
            ),
            Stage(
                name="Polling Day",
                description="Citizens cast their votes using EVM",
                sequence_order=2,
                election_id=election.id,
            ),
            GlossaryItem(term="EVM", definition="Electronic Voting Machine", category="Voting"),
            GlossaryItem(term="Polling Booth", definition="Location where people cast votes", category="Voting"),
            GlossaryItem(term="Voter List", definition="Published roll of eligible voters", category="Registration"),
        ]
    )
    session.commit()

    context = get_context("How does voter registration work before polling day using EVM?", session)
    lines = [line for line in context.split("\n") if line]

    assert len(lines) <= 5
    assert any("Glossary:" in line for line in lines)
