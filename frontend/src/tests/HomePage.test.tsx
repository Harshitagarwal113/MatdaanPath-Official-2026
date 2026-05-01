import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { requestChatOpen } from "@/lib/chat-events";

vi.mock("@/components/Timeline", () => ({
  default: () => <div>Timeline Content</div>,
}));
vi.mock("@/components/EligibilityChecker", () => ({
  default: () => <div>Eligibility Content</div>,
}));
vi.mock("@/components/Glossary", () => ({
  default: () => <div>Glossary Content</div>,
}));
vi.mock("@/components/OpsConsole", () => ({
  default: () => <div>Operations Content</div>,
}));
vi.mock("@/components/ChatAssistant", () => ({
  default: () => <div>Chat Assistant</div>,
}));
vi.mock("@/components/GoogleServicesPanel", () => ({
  default: () => <div>Google Services Panel</div>,
}));
vi.mock("@/components/ImportantDates", () => ({
  default: () => <div>Important Dates</div>,
}));
vi.mock("@/components/RegionSelector", () => ({
  default: () => <div>Region Selector</div>,
}));
vi.mock("@/lib/chat-events", () => ({
  requestChatOpen: vi.fn(),
}));

const TAB_STORAGE_KEY = "matdaanpath:active-tab:v1";

describe("Home page", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders a navigable main landmark and saves tab selection", () => {
    render(<Home />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("heading", { level: 1, name: "MatdaanPath" })).toBeInTheDocument();
    expect(screen.getByText("Timeline Content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Eligibility/i }));
    expect(screen.getByText("Eligibility Content")).toBeInTheDocument();
    expect(window.localStorage.getItem(TAB_STORAGE_KEY)).toBe("eligibility");
  });

  it("restores the previously selected tab from local storage", () => {
    window.localStorage.setItem(TAB_STORAGE_KEY, "operations");
    render(<Home />);

    expect(screen.getByText("Operations Content")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Operations/i })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps external action links protected with noopener noreferrer", () => {
    render(<Home />);

    const registerNowLink = screen.getByRole("link", { name: /Register Now/i });
    expect(registerNowLink).toHaveAttribute("target", "_blank");
    expect(registerNowLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(registerNowLink).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("exposes an accessible tablist and opens chat from the CTA", () => {
    render(<Home />);

    expect(screen.getByRole("tablist", { name: /Project Features/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Open Chatbot/i }));
    expect(requestChatOpen).toHaveBeenCalledTimes(1);
  });
});
