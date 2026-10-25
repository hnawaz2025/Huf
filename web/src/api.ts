import type { AskResult, DraftItem, Item } from "./types";

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

export function listItems(): Promise<Item[]> {
  return request<Item[]>("/api/items");
}

export function saveItems(items: DraftItem[], sourceTranscript: string): Promise<Item[]> {
  return request<Item[]>("/api/items", {
    method: "POST",
    body: JSON.stringify({ items, source_transcript: sourceTranscript }),
  });
}

export function ask(question: string): Promise<AskResult> {
  return request<AskResult>("/api/ask", {
    method: "POST",
    body: JSON.stringify({ question, ...localContext() }),
  });
}

export type ItemPatch = Partial<Pick<Item, "kind" | "text" | "person" | "due_text" | "due_date" | "recurrence" | "status">>;

export function updateItem(id: string, patch: ItemPatch): Promise<Item> {
  return request<Item>(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteItem(id: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  } catch {
    throw new Error("Can't reach Huf's server — is it running?");
  }
  if (!res.ok && res.status !== 404) throw new Error("Couldn’t delete — try again.");
}
