import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@/lib/google-services", () => ({
  isGoogleServicesConfigured: () => false,
  trackOutboundLink: vi.fn(() => Promise.resolve()),
  trackPageView: vi.fn(() => Promise.resolve()),
  trackUserAction: vi.fn(() => Promise.resolve()),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();
