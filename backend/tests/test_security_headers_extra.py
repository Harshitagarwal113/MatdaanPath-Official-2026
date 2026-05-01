from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import EligibilityRule


def test_security_headers_include_baseline_policies(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200

    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert response.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"
    assert response.headers["Cross-Origin-Opener-Policy"] == "same-origin"
    assert response.headers["Cross-Origin-Resource-Policy"] == "same-origin"
    assert response.headers["X-XSS-Protection"] == "0"

    csp = response.headers["Content-Security-Policy"]
    assert "default-src 'self'" in csp
    assert "base-uri 'self'" in csp
    assert "form-action 'self'" in csp
    assert "object-src 'none'" in csp
    assert "frame-ancestors 'none'" in csp
    assert "connect-src 'self'" in csp
    assert "https://*.googleapis.com" in csp


def test_cors_preflight_allows_configured_localhost_origin(client: TestClient):
    response = client.options(
        "/api/timeline/",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "GET" in response.headers["access-control-allow-methods"]


def test_cache_control_not_applied_to_non_get_requests(
    client: TestClient, session: Session
):
    session.add(
        EligibilityRule(
            question="Are you an Indian citizen?",
            rule_key="citizenship",
            expected_value="yes",
            explanation_if_failed="Citizenship is required.",
            sequence_order=1,
        )
    )
    session.commit()

    response = client.post(
        "/api/eligibility/check",
        json={"answers": {"citizenship": "yes"}},
    )
    assert response.status_code == 200
    assert "Cache-Control" not in response.headers


def test_hsts_header_is_set_for_https_requests(client: TestClient):
    secure_client = TestClient(client.app, base_url="https://testserver")
    response = secure_client.get("/health")

    assert response.status_code == 200
    assert response.headers["Strict-Transport-Security"] == "max-age=63072000; includeSubDomains; preload"
