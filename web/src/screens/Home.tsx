import { useEffect, useState } from "react";
import { extract } from "../api";
import { ItemCard } from "../components/ItemCard";
import { MicButton } from "../components/MicButton";
import type { DraftItem, Item } from "../types";
import { SPEECH_MESSAGES, useSpeech } from "../useSpeech";
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
  const speech = useSpeech();

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

  async function done() {
    const said = await speech.stop();
    if (said) makeSense(said);
  }

  function typeInstead() {
    speech.cancel();
    setPhase({ name: "typing" });
  }

  if (speech.status === "listening") {
    return (
      <section className="listening" aria-live="polite">
        <p className="caption">
          {speech.finalText || speech.interim ? (
            <>
              {speech.finalText} <span className="caption__interim">{speech.interim}</span>
            </>
          ) : (
            <span className="caption__interim">Go ahead — I’m listening.</span>
          )}
        </p>
        <div className="capture capture--live">
          <MicButton listening label="Done" onClick={done} />
          <p className="capture__hint">Listening…</p>
        </div>
        <div className="listening__done">
          <button type="button" className="btn btn--wide" onClick={done}>
            Done
          </button>
        </div>
      </section>
    );
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
          <MicButton label="Tap to talk" onClick={speech.start} />
          {speech.status === "error" && speech.error ? (
            <div className="voice-error" role="alert">
              <p>{SPEECH_MESSAGES[speech.error]}</p>
              <div className="voice-error__actions">
                {speech.error !== "unsupported" && (
                  <button type="button" className="btn btn--small" onClick={speech.start}>
                    Try again
                  </button>
                )}
                <button type="button" className="btn btn--small btn--ghost" onClick={typeInstead}>
                  Type instead
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="capture__hint">Tap to talk</p>
              <button type="button" className="link" onClick={typeInstead}>
                Type instead
              </button>
            </>
          )}
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
