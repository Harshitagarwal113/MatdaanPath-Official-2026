export const OPEN_CHAT_EVENT = "matdaanpath:open-chat";

export function requestChatOpen(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
}
