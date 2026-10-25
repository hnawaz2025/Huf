import { useState } from "react";
import { saveItems } from "../api";
import { ItemCard } from "../components/ItemCard";
import { ItemEditor } from "../components/ItemEditor";
import { possibleMatches } from "../people";
import type { DraftItem, Item } from "../types";

interface Props {
  transcript: string;
  initialItems: DraftItem[];
  saved: Item[];
  onSaved: (items: Item[]) => void;
  onStartOver: () => void;
}

interface Draft {
  key: number;
  item: DraftItem;
  spokenPerson: string | null; // what Huf heard, kept so the chooser can offer it back
}

function saveLabel(n: number) {
  if (n === 1) return "Save";
  if (n === 2) return "Save both";
  return `Save ${n} items`;
}

export function Review({ transcript, initialItems, saved, onSaved, onStartOver }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    initialItems.map((item, key) => ({ key, item, spokenPerson: item.person })),
  );
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: number, item: DraftItem) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, item } : d)));
  const remove = (key: number) => {
    setDrafts((ds) => ds.filter((d) => d.key !== key));
    if (editing === key) setEditing(null);
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await saveItems(drafts.map((d) => d.item), transcript));
    } catch {
      setError("Couldn’t save — try again.");
      setSaving(false);
    }
  }

  return (
    <section className="review" aria-labelledby="review-title">
      <p className="eyebrow">You said</p>
      <blockquote className="quote">“{transcript}”</blockquote>

      <h2 id="review-title" className="eyebrow review__heading">
        {drafts.length ? "Huf understood" : "Nothing to save"}
      </h2>

      {drafts.length ? (
        <div className="stack">
          {drafts.map(({ key, item, spokenPerson }) => {
            if (editing === key) {
              return (
                <article key={key} className={`card card--${item.kind} card--editing`}>
                  <ItemEditor item={item} onChange={(i) => update(key, i)} onDone={() => setEditing(null)} />
                </article>
              );
            }
            const matches = possibleMatches(spokenPerson, saved);
            return (
              <ItemCard
                key={key}
                item={item}
                actions={
                  <>
                    <button type="button" className="text-btn" onClick={() => setEditing(key)}>
                      Edit
                    </button>
                    <button type="button" className="text-btn text-btn--quiet" onClick={() => remove(key)}>
                      Remove
                    </button>
                  </>
                }
              >
                {matches.length > 0 && spokenPerson && (
                  <div className="chooser" role="radiogroup" aria-label={`Which ${spokenPerson}?`}>
                    <span className="chooser__label">Which {spokenPerson.split(" ")[0]}?</span>
                    <div className="chooser__options">
                      {[...matches, spokenPerson].map((p) => (
                        <button
                          key={p}
                          type="button"
                          role="radio"
                          aria-checked={item.person === p}
                          className={`chip${item.person === p ? " is-on" : ""}`}
                          onClick={() => update(key, { ...item, person: p })}
                        >
                          {p === spokenPerson ? `Keep “${p}”` : p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </ItemCard>
            );
          })}
        </div>
      ) : (
        <p className="muted">Huf didn’t find anything to save in that.</p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="btn btn--ghost" onClick={onStartOver} disabled={saving}>
          Start over
        </button>
        {drafts.length > 0 && (
          <button type="button" className="btn" onClick={save} disabled={saving || editing !== null}>
            {saving ? "Saving…" : saveLabel(drafts.length)}
          </button>
        )}
      </div>
    </section>
  );
}
