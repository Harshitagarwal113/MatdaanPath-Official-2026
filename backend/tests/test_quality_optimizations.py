from datetime import UTC, datetime, timedelta

from app.core.settings import get_settings
from app.models import Deadline, Election, EligibilityRule, GlossaryItem


def test_security_headers_are_hardened(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Permitted-Cross-Domain-Policies"] == "none"
    assert response.headers["X-DNS-Prefetch-Control"] == "off"
    assert "unsafe-eval" not in response.headers["Content-Security-Policy"]


def test_reminder_delivery_requires_verification_token_when_configured(
    client, monkeypatch
):
    monkeypatch.setenv("CLOUD_TASKS_VERIFICATION_TOKEN", "expected-token")
    get_settings.cache_clear()

    payload = {
        "email": "citizen@example.com",
        "deadline_name": "Registration Deadline",
        "deadline_date": "2026-07-11T10:00:00Z",
        "region_code": "IN",
    }

    unauthorized_response = client.post("/api/reminders/deliver", json=payload)
    assert unauthorized_response.status_code == 401

    authorized_response = client.post(
        "/api/reminders/deliver",
        json=payload,
        headers={"X-Tasks-Token": "expected-token"},
    )
    assert authorized_response.status_code == 200
    assert authorized_response.json()["delivered"] is False

    monkeypatch.delenv("CLOUD_TASKS_VERIFICATION_TOKEN", raising=False)
    get_settings.cache_clear()


def test_glossary_endpoint_supports_search_and_category_filters(
    client, session
):  # noqa: E501
    session.add_all(
        [
            GlossaryItem(
                term="EVM",
                definition="Electronic Voting Machine",
                category="Technology",
            ),
            GlossaryItem(
                term="Polling Booth",
                definition="Official voting place",
                category="General",
            ),
            GlossaryItem(
                term="VVPAT",
                definition="Paper audit trail",
                category="Technology",
            ),
        ]
    )
    session.commit()

    search_response = client.get("/api/glossary/?search=poll")
    assert search_response.status_code == 200
    assert [item["term"] for item in search_response.json()] == [
        "Polling Booth"
    ]  # noqa: E501

    filtered_response = client.get("/api/glossary/?category=Technology")
    assert filtered_response.status_code == 200
    assert {item["term"] for item in filtered_response.json()} == {
        "EVM",
        "VVPAT",
    }


def test_eligibility_check_normalizes_case_and_whitespace(client, session):
    session.add_all(
        [
            EligibilityRule(
                question="Are you 18+ years old?",
                rule_key="age",
                expected_value="yes",
                explanation_if_failed="You must be at least 18.",
                sequence_order=1,
            ),
            EligibilityRule(
                question="Are you an Indian citizen?",
                rule_key="citizenship",
                expected_value="yes",
                explanation_if_failed="Citizenship is required.",
                sequence_order=2,
            ),
        ]
    )
    session.commit()

    response = client.post(
        "/api/eligibility/check",
        json={"answers": {"age": " YES ", "citizenship": "YeS"}},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["eligible"] is True
    assert payload["failed_rules"] == []


def test_deadlines_endpoint_respects_limit(client, session):
    election = Election(
        name="General Election", election_type="Lok Sabha", year=2026
    )  # noqa: E501
    session.add(election)
    session.commit()
    session.refresh(election)

    now = datetime.now(UTC).replace(tzinfo=None)
    session.add_all(
        [
            Deadline(
                name="First Deadline",
                date=now + timedelta(days=10),
                election_id=election.id,
            ),
            Deadline(
                name="Second Deadline",
                date=now + timedelta(days=20),
                election_id=election.id,
            ),
        ]
    )
    session.commit()

    response = client.get("/api/deadlines/?limit=1")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_google_services_status_exposes_cloud_run_readiness(client):
    response = client.get("/api/google-services/status")
    assert response.status_code == 200

    payload = response.json()
    assert isinstance(payload["ready_for_cloud_run"], bool)
    assert isinstance(payload["blocking_issues"], list)
    assert payload["deployment_mode"] in {"local", "cloud_run"}
    assert "ready" in payload["gemini"]
    assert "sdk_available" in payload["cloud_tasks"]
    assert "client_available" in payload["cloud_tasks"]
    assert "ready" in payload["secret_manager"]
