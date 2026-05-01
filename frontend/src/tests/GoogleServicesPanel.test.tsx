import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GoogleServicesPanel from "@/components/GoogleServicesPanel";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("GoogleServicesPanel", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(
      jsonResponse({
        google_cloud_project: "matdaanpath-prod",
        cloud_run_service: "matdaanpath-api",
        cloud_run_revision: "matdaanpath-api-00012",
        deployment_mode: "cloud_run",
        ready_for_cloud_run: false,
        blocking_issues: ["Cloud Tasks is not ready."],
        observability: {
          cloud_logging_enabled: true,
          error_reporting_enabled: true,
        },
        gemini: {
          gemini_enabled: true,
          ready: true,
          provider: "gemini_api_key",
          model: "gemini-2.0-flash-lite",
          vertex_project_configured: true,
          vertex_location: "asia-south1",
          secret_manager_enabled: true,
        },
        firebase_auth: {
          enabled: true,
          ready: true,
          sdk_available: true,
          project_id_configured: true,
        },
        cloud_tasks: {
          configured: false,
          sdk_available: false,
          client_available: false,
          ready: false,
          queue_id: "unconfigured",
          target_url_configured: false,
          local_fallback_queue_size: 0,
        },
        secret_manager: {
          configured: true,
          sdk_available: true,
          ready: true,
        },
        admin_auth: {
          configured: true,
          allow_insecure_admin: false,
        },
        updated_at: "2026-04-27T10:00:00+00:00",
      }),
    );
  });

  it("renders runtime service readiness from backend status", async () => {
    render(<GoogleServicesPanel />);

    await waitFor(() => {
      expect(screen.getByRole("list", { name: /Google service readiness checks/i })).toBeInTheDocument();
      expect(screen.getByText(/Gemini Assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Run Runtime/i)).toBeInTheDocument();
      expect(screen.getByText(/Firebase Auth/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Tasks Reminders/i)).toBeInTheDocument();
      expect(screen.getByText(/matdaanpath-api/i)).toBeInTheDocument();
    });

    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(7);
    expect(screen.getAllByText(/Ready/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Needs Config/i)).toBeInTheDocument();
  });
});
