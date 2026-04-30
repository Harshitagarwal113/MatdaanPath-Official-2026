import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Glossary from "@/components/Glossary";
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

describe("Glossary", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetApiResourceCacheForTests();
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("search=evm")) {
        return jsonResponse([
          {
            term: "EVM",
            definition: "Electronic Voting Machine",
            category: "Technology",
          },
        ]);
      }

      return jsonResponse([
        {
          term: "EVM",
          definition: "Electronic Voting Machine",
          category: "Technology",
        },
        {
          term: "Polling Booth",
          definition: "Official polling location",
          category: "General",
        },
      ]);
    });
  });

  it("renders glossary items and supports debounced search", async () => {
    render(<Glossary />);

    await waitFor(() => {
      expect(screen.getByText(/EVM/i)).toBeInTheDocument();
      expect(screen.getByText(/Polling Booth/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Search election glossary terms/i), {
      target: { value: "evm" },
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/glossary/?search=evm"),
        expect.any(Object),
      );
    });
  });
});
