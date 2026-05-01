import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ImportantDates from "@/components/ImportantDates";
import { resetApiResourceCacheForTests } from "@/hooks/use-api-resource";

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

describe("ImportantDates", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetApiResourceCacheForTests();
    window.localStorage.clear();
    vi.spyOn(window, "prompt").mockReturnValue("voter@example.com");

    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/reminders/subscribe") && init?.method === "POST") {
        return jsonResponse({
          queued: true,
          provider: "cloud_tasks",
          task_name: "task-1",
          scheduled_for: "2026-07-11T10:00:00Z",
        });
      }

      return jsonResponse([
        {
          id: 1,
          name: "Registration Deadline",
          date: "2026-07-11T10:00:00Z",
          description: "Last date to register.",
        },
      ]);
    });
  });

  it("loads deadlines and schedules a reminder", async () => {
    render(<ImportantDates regionId={null} />);

    await waitFor(() => {
      expect(screen.getByRole("list", { name: /Upcoming deadlines list/i })).toHaveAttribute("aria-busy", "false");
      expect(screen.getByText(/Registration Deadline/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Set reminder/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/reminders/subscribe"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(screen.getByText(/Reminder scheduled/i)).toBeInTheDocument();
      expect(screen.getByText(/Reminder scheduled/i)).toHaveAttribute("role", "status");
    });
  });
});
