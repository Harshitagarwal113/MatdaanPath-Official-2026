import json
import os
import sys

from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def main() -> int:
    client = TestClient(app)
    response = client.get(
        "/api/google-services/status",
        params={"include_observability_issues": "true"},
    )

    if response.status_code != 200:
        print(f"[google-predeploy-check] Failed to fetch status: HTTP {response.status_code}")
        return 2

    payload = response.json()
    print("[google-predeploy-check] Runtime status:")
    print(json.dumps(payload, indent=2))

    if payload.get("ready_for_cloud_run"):
        print("[google-predeploy-check] PASS: Google services are ready for Cloud Run.")
        return 0

    print("[google-predeploy-check] FAIL: Blocking issues detected:")
    for issue in payload.get("blocking_issues", []):
        print(f" - {issue}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
