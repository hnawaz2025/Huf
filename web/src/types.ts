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
