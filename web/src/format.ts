import type { DraftItem } from "./types";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Mon, Oct 26" from "2026-10-26", read as a local calendar date. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** The when-line on a reminder: the speaker's own words first, then the real date. */
export function dueLabel(item: Pick<DraftItem, "due_text" | "due_date" | "recurrence">): string | null {
  const parts: string[] = [];
  if (item.recurrence) {
    parts.push(capitalize(item.recurrence));
    if (item.due_date) parts.push(`next ${shortDate(item.due_date)}`);
  } else {
    if (item.due_text) parts.push(capitalize(item.due_text));
    if (item.due_date) parts.push(shortDate(item.due_date));
  }
  return parts.length ? parts.join(" · ") : null;
}
