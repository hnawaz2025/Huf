import { useEffect, useState } from "react";
import { extract } from "../api";
import { ItemCard } from "../components/ItemCard";
import { MicButton } from "../components/MicButton";
import type { DraftItem, Item } from "../types";
import { Review } from "./Review";

type Phase =
  | { name: "idle" }
  | { name: "typing" }
  | { name: "processing"; transcript: string }
  | { name: "review"; transcript: string; items: DraftItem[] }
  | { name: "error"; transcript: string; message: string };

interface Props {
  items: Item[];
  onSaved: (items: Item[]) => void;
}

/** Next pending reminders first (undated last), then the newest memories. */
function comingUp(items: Item[]) {
  return items
    .filter((i) => i.kind === "reminder" && i.status === "pending")
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, 3);
}

function recentlyRemembered(items: Item[]) {
  return items.filter((i) => i.kind === "memory").slice(0, 2);
}

export function Home({ items, onSaved }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function makeSense(transcript: string) {
    const text = transcript.trim();
    if (!text) return;
    setPhase({ name: "processing", transcript: text });
    try {
      const found = await extract(text);
      setPhase({ name: "review", transcript: text, items: found });
    } catch (e) {
      setPhase({ name: "error", transcript: text, message: (e as Error).message });
    }
  }

  function startOver() {
    setDraft("");
    setPhase({ name: "idle" });
  }

  if (phase.name === "review") {
    return (
      <Review
        transcript={phase.transcript}
        initialItems={phase.items}
        saved={items}
        onStartOver={startOver}
        onSaved={(saved) => {
          onSaved(saved);
          startOver();
          setToast(saved.length === 1 ? "Saved. Huf will remember." : `Saved ${saved.length} items. Huf will remember.`);
        }}
      />
    );
  }

  if (phase.name === "processing") {
    return (
      <section className="processing" aria-live="polite">
        <blockquote className="quote">“{phase.transcript}”</blockquote>
        <p className="processing__label">Making sense of your thoughts…</p>
        <div className="dots" aria-hidden>
          <i />
          <i />
          <i />
        </div>
      </section>
    );
  }

  if (phase.name === "error") {
    return (
      <section className="processing" role="alert">
        <blockquote className="quote">“{phase.transcript}”</blockquote>
        <p className="processing__label">{phase.message}</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => makeSense(phase.transcript)}>
            Try again
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setDraft(phase.transcript);
              setPhase({ name: "typing" });
            }}
          >
            Edit text
          </button>
        </div>
      </section>
    );
  }

  const upcoming = comingUp(items);
  const recent = recentlyRemembered(items);

  return (
    <section className="home">
      <h1 className="greeting">What’s on your mind?</h1>

      {phase.name === "typing" ? (
        <form
          className="type-box"
          onSubmit={(e) => {
            e.preventDefault();
            makeSense(draft);
          }}
        >
          <textarea
            autoFocus
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type it the way you’d say it…"
            aria-label="Your thought"
          />
          <div className="actions">
            <button type="button" className="btn btn--ghost" onClick={startOver}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!draft.trim()}>
              Send
            </button>
          </div>
        </form>
      ) : (
        <div className={`capture${upcoming.length || recent.length ? " capture--compact" : ""}`}>
          {/* Voice capture arrives in slice 4; until then the mic opens typing. */}
          <MicButton label="Tap to talk" onClick={() => setPhase({ name: "typing" })} />
          <p className="capture__hint">Tap to talk</p>
          <button type="button" className="link" onClick={() => setPhase({ name: "typing" })}>
            Type instead
          </button>
        </div>
      )}

      {phase.name === "idle" && upcoming.length > 0 && (
        <section className="section" aria-labelledby="coming-up">
          <h2 id="coming-up" className="eyebrow">
            Coming up
          </h2>
          <div className="stack">
            {upcoming.map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      )}

      {phase.name === "idle" && recent.length > 0 && (
        <section className="section" aria-labelledby="recently">
          <h2 id="recently" className="eyebrow">
            Recently remembered
          </h2>
          <div className="stack">
            {recent.map((i) => (
              <ItemCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
