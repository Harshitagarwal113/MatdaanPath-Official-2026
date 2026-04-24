import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RegionSelector from "@/components/RegionSelector";

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

describe("RegionSelector", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(
      jsonResponse([
        { id: 1, name: "India", code: "IN", description: "National election coverage." },
        { id: 2, name: "Maharashtra", code: "MH", description: "State-specific updates." },
      ]),
    );
  });

  it("loads regions and notifies the parent on selection", async () => {
    const onRegionChange = vi.fn();
    render(<RegionSelector onRegionChange={onRegionChange} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Maharashtra/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Choose a region/i), {
      target: { value: "2" },
    });

    expect(onRegionChange).toHaveBeenCalledWith(2);
  });
});
