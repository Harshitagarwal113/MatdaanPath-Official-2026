import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Timeline from "@/components/Timeline";
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

describe("Timeline", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetApiResourceCacheForTests();
    mockFetch.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          name: "Voter Registration",
          description: "Register in the electoral roll.",
          sequence_order: 1,
        },
        {
          id: 2,
          name: "Polling Day",
          description: "Cast your vote at your booth.",
          sequence_order: 2,
        },
      ]),
    );
  });

  it("renders timeline stages and allows selecting a different step", async () => {
    render(<Timeline />);

    await waitFor(() => {
      expect(screen.getByRole("list", { name: /Election journey stages/i })).toBeInTheDocument();
      expect(screen.getByText(/Voter Registration/i)).toBeInTheDocument();
      expect(screen.getByText(/Polling Day/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
    });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Polling Day/i }));
    expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument();
  });
});
