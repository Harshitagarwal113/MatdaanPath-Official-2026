import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EligibilityChecker from "@/components/EligibilityChecker";

const mockRules = [
  {
    id: 1,
    question: "Are you 18?",
    requirement_description: "You must be at least 18 years old on the qualifying date.",
    rule_key: "age",
    sequence_order: 1,
  },
  {
    id: 2,
    question: "Are you a citizen?",
    requirement_description: "Only Indian citizens can vote in Indian elections.",
    rule_key: "citizenship",
    sequence_order: 2,
  },
];

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

describe("EligibilityChecker", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    window.localStorage.clear();
    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.includes("/api/eligibility/rules")) {
        return jsonResponse(mockRules);
      }

      if (url.includes("/api/eligibility/check")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as { answers: Record<string, string> };
        const eligible = Object.values(body.answers).every((value) => value === "yes");

        return jsonResponse({
          eligible,
          message: eligible
            ? "You appear eligible to vote based on the answers provided."
            : "One or more eligibility requirements were not met.",
          failed_rules: eligible ? [] : ["Are you a citizen?"],
        });
      }

      throw new Error(`Unhandled request: ${url}`);
    });
  });

  it("renders rules after fetching them", async () => {
    render(<EligibilityChecker />);

    await waitFor(() => {
      expect(screen.getByText(/Are you 18\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Are you a citizen\?/i)).toBeInTheDocument();
    });
  });

  it("shows the eligible result when all answers are yes", async () => {
    render(<EligibilityChecker />);

    await waitFor(() => {
      expect(screen.getByText(/Are you 18\?/i)).toBeInTheDocument();
    });

    const yesButtons = screen.getAllByRole("button", { name: /^Yes,/i });
    fireEvent.click(yesButtons[0]);
    fireEvent.click(yesButtons[1]);

    expect(yesButtons[0]).toHaveAttribute("aria-pressed", "true");
    expect(yesButtons[1]).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => {
      expect(screen.getByText(/Likely Eligible/i)).toBeInTheDocument();
    });
  });

  it("shows a review state when any answer is no", async () => {
    render(<EligibilityChecker />);

    await waitFor(() => {
      expect(screen.getByText(/Are you 18\?/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Yes, Are you 18\?/i }));
    fireEvent.click(screen.getByRole("button", { name: /No, Are you a citizen\?/i }));

    await waitFor(() => {
      expect(screen.getByText(/Needs Review/i)).toBeInTheDocument();
      expect(screen.getByText(/Review these answers again/i)).toBeInTheDocument();
    });
  });

  it("exposes eligibility questions as a grouped fieldset", async () => {
    render(<EligibilityChecker />);

    await waitFor(() => {
      expect(screen.getByRole("group", { name: /Eligibility Questions/i })).toBeInTheDocument();
    });
  });
});
