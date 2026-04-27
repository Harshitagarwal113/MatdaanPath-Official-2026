import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChatAssistant from "@/components/ChatAssistant";

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

describe("ChatAssistant", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    window.localStorage.clear();
  });

  it("renders the FAB button initially", () => {
    render(<ChatAssistant />);
    expect(screen.getByLabelText(/Open Chat Assistant/i)).toBeInTheDocument();
  });

  it("opens the chat window when clicked", () => {
    render(<ChatAssistant />);
    fireEvent.click(screen.getByLabelText(/Open Chat Assistant/i));
    expect(screen.getByRole("dialog", { name: /Election Intelligence Assistant/i })).toBeInTheDocument();
  });

  it("allows typing in the input field", () => {
    render(<ChatAssistant />);
    fireEvent.click(screen.getByLabelText(/Open Chat Assistant/i));

    const input = screen.getByLabelText(/Chat input message/i);
    fireEvent.change(input, { target: { value: "How do I vote?" } });

    expect(input).toHaveValue("How do I vote?");
  });

  it("sends a message and renders the AI response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        response: "You can register through the official voter portal.",
        sources: [{ name: "Voter Service Portal", url: "https://voters.eci.gov.in", source_type: "portal" }],
        disclaimer: "This guidance is educational.",
      }),
    );

    render(<ChatAssistant />);
    fireEvent.click(screen.getByLabelText(/Open Chat Assistant/i));

    fireEvent.change(screen.getByLabelText(/Chat input message/i), {
      target: { value: "How do I register?" },
    });
    fireEvent.click(screen.getByLabelText(/Send message/i));

    await waitFor(() => {
      expect(screen.getByText(/official voter portal/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Voter Service Portal/i })).toBeInTheDocument();
    expect(screen.getByText(/guidance is educational/i)).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat/"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
