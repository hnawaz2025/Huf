// Mirrors server/schemas.py.

export type Kind = "memory" | "reminder";

export interface DraftItem {
  kind: Kind;
  text: string;
  person: string | null;
  due_text: string | null;
  due_date: string | null; // YYYY-MM-DD
  recurrence: string | null;
}

export interface Item extends DraftItem {
  id: string;
  status: "pending" | "completed" | null; // reminders only
  source_transcript: string;
  created_at: string;
  updated_at: string;
}
