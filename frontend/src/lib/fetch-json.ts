import API_BASE_URL from "@/lib/api";

export class FetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }
  } catch {
    // Fall through to the generic HTTP status message.
  }

  return `Request failed with status ${response.status}.`;
}

function withTimeout(signal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const abortOnParentSignal = () => controller.abort();
  signal?.addEventListener("abort", abortOnParentSignal, { once: true });

  return {
    signal: controller.signal,
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortOnParentSignal);
    },
  };
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const timeoutContext = withTimeout(init?.signal, 10_000);
  let response: Response;

  try {
    response = await fetch(resolveUrl(path), {
      ...init,
      signal: timeoutContext.signal,
      headers,
    });
  } catch (error) {
    if (timeoutContext.signal.aborted) {
      throw new FetchError("The request timed out. Please try again.", 408);
    }
    throw error;
  } finally {
    timeoutContext.cleanup();
  }

  if (!response.ok) {
    throw new FetchError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as T;
}
