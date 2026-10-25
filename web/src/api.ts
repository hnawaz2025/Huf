import type { DraftItem } from "./types";

/** Today's date as the person's device sees it — Huf resolves "tomorrow" from this, not the server clock. */
function localContext() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    today: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Can't reach Huf's server — is it running?");
  }
  if (!res.ok) {
    if (res.status === 502 || res.status === 500) {
      throw new Error("Huf couldn't make sense of that right now.");
    }
    throw new Error("Something went wrong. Please try again.");
  }
  return res.json() as Promise<T>;
}

export async function extract(transcript: string): Promise<DraftItem[]> {
  const data = await request<{ items: DraftItem[] }>("/api/extract", {
    method: "POST",
    body: JSON.stringify({ transcript, ...localContext() }),
  });
  return data.items;
}
