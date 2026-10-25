import { useEffect, useState } from "react";
import { deleteItem, updateItem } from "../api";
import { ItemCard } from "../components/ItemCard";
import { ItemEditor } from "../components/ItemEditor";
import type { DraftItem, Item } from "../types";

interface Props {
  items: Item[];
  onChanged: () => Promise<unknown>;
  onGoHome: () => void;
}

/** Everything Huf remembers, newest first. Tap one to edit, complete, or delete it. */
export function Memories({ items, onChanged, onGoHome }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((i) => i.id === openId) ?? null;

  if (items.length === 0) {
    return (
      <section className="memories">
        <h1 className="greeting">Memories</h1>
        <p className="muted memories__empty">
          Nothing saved yet. Tell Huf what’s on your mind and it will keep it here.
        </p>
        <button type="button" className="btn btn--ghost memories__cta" onClick={onGoHome}>
          Go to Home
        </button>
      </section>
    );
  }

  const memories = items.filter((i) => i.kind === "memory").length;
  const reminders = items.length - memories;

  return (
    <section className="memories">
      <h1 className="greeting">Memories</h1>
      <p className="muted memories__count">
        {memories} {memories === 1 ? "memory" : "memories"} · {reminders} {reminders === 1 ? "reminder" : "reminders"}
      </p>
      <div className="stack memories__list">
        {items.map((i) => (
          <button key={i.id} type="button" className="card-button" onClick={() => setOpenId(i.id)}>
            <ItemCard item={i} />
          </button>
        ))}
      </div>
      {open && <DetailSheet item={open} onClose={() => setOpenId(null)} onChanged={onChanged} />}
    </section>
  );
}

function DetailSheet({ item, onClose, onChanged }: { item: Item; onClose: () => void; onChanged: () => Promise<unknown> }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [draft, setDraft] = useState<DraftItem>(item);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(action: () => Promise<unknown>, closeAfter = false) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      if (closeAfter) onClose();
      else setMode("view");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isReminder = item.kind === "reminder";
  const done = item.status === "completed";

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item.kind === "memory" ? "Memory" : "Reminder"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" aria-hidden />
        {mode === "edit" ? (
          <ItemEditor
            item={draft}
            onChange={setDraft}
            doneLabel="Save changes"
            busy={busy}
            onDone={() =>
              run(() =>
                updateItem(item.id, {
                  kind: draft.kind,
                  text: draft.text.trim(),
                  person: draft.person?.trim() || null,
                  due_text: draft.due_text,
                  due_date: draft.due_date,
                  recurrence: draft.recurrence,
                }),
              )
            }
          />
        ) : (
          <>
            <ItemCard item={item} />
            <p className="sheet__source">
              <span className="eyebrow">You said</span>“{item.source_transcript}”
            </p>
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {mode === "view" && (
          <div className="sheet__actions">
            {isReminder && (
              <button
                type="button"
                className="btn sheet__primary"
                disabled={busy}
                onClick={() => run(() => updateItem(item.id, { status: done ? "pending" : "completed" }))}
              >
                {done ? "Mark as not done" : "Mark as done"}
              </button>
            )}
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={() => {
                setDraft(item);
                setMode("edit");
              }}
            >
              Edit
            </button>
            <button type="button" className="btn btn--ghost btn--danger" disabled={busy} onClick={() => setMode("confirm-delete")}>
              Delete
            </button>
          </div>
        )}

        {mode === "confirm-delete" && (
          <div className="sheet__confirm">
            <p>Delete this {item.kind}? Huf will forget it.</p>
            <div className="sheet__actions">
              <button type="button" className="btn btn--danger-solid" disabled={busy} onClick={() => run(() => deleteItem(item.id), true)}>
                Delete
              </button>
              <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => setMode("view")}>
                Keep it
              </button>
            </div>
          </div>
        )}

        {mode === "edit" && (
          <button type="button" className="link sheet__cancel" onClick={() => setMode("view")} disabled={busy}>
            Cancel
          </button>
        )}
        {mode === "view" && (
          <button type="button" className="link sheet__cancel" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
