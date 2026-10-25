import type { DraftItem, Kind } from "../types";

interface Props {
  item: DraftItem;
  onChange: (item: DraftItem) => void;
  onDone: () => void;
  doneLabel?: string;
  busy?: boolean;
}

const REPEATS = ["", "daily", "weekly", "monthly", "yearly"];

/** Edit every field Huf extracted. Used on Review and in the Memories detail sheet. */
export function ItemEditor({ item, onChange, onDone, doneLabel = "Done", busy = false }: Props) {
  const set = (patch: Partial<DraftItem>) => onChange({ ...item, ...patch });
  const setKind = (kind: Kind) =>
    set(kind === "memory" ? { kind, due_text: null, due_date: null, recurrence: null } : { kind });

  return (
    <div className="editor">
      <div className="segmented" role="radiogroup" aria-label="Type">
        {(["memory", "reminder"] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={item.kind === k}
            className={item.kind === k ? "is-on" : ""}
            onClick={() => setKind(k)}
          >
            {k === "memory" ? "Memory" : "Reminder"}
          </button>
        ))}
      </div>

      <label className="field">
        <span>What</span>
        <textarea rows={2} value={item.text} onChange={(e) => set({ text: e.target.value })} />
      </label>

      <label className="field">
        <span>Person</span>
        <input
          value={item.person ?? ""}
          placeholder="No one"
          onChange={(e) => set({ person: e.target.value || null })}
        />
      </label>

      {item.kind === "reminder" && (
        <div className="field-row">
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={item.due_date ?? ""}
              // a new date makes the spoken phrase ("tomorrow") wrong, so drop it
              onChange={(e) => set({ due_date: e.target.value || null, due_text: null })}
            />
          </label>
          <label className="field">
            <span>Repeats</span>
            <select value={item.recurrence ?? ""} onChange={(e) => set({ recurrence: e.target.value || null })}>
              {REPEATS.map((r) => (
                <option key={r} value={r}>
                  {r ? r[0].toUpperCase() + r.slice(1) : "Never"}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="editor__done">
        <button type="button" className="btn btn--small" onClick={onDone} disabled={!item.text.trim() || busy}>
          {doneLabel}
        </button>
      </div>
    </div>
  );
}
