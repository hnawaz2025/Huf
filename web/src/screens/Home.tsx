import { useState } from "react";
import { extract } from "../api";
import { MicButton } from "../components/MicButton";
import type { DraftItem } from "../types";
import { Review } from "./Review";

type Phase =
  | { name: "idle" }
  | { name: "typing" }
  | { name: "processing"; transcript: string }
  | { name: "review"; transcript: string; items: DraftItem[] }
  | { name: "error"; transcript: string; message: string };

export function Home() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [draft, setDraft] = useState("");

  async function makeSense(transcript: string) {
    const text = transcript.trim();
    if (!text) return;
    setPhase({ name: "processing", transcript: text });
    try {
      const items = await extract(text);
      setPhase({ name: "review", transcript: text, items });
    } catch (e) {
      setPhase({ name: "error", transcript: text, message: (e as Error).message });
    }
  }

  function startOver() {
    setDraft("");
    setPhase({ name: "idle" });
  }

  if (phase.name === "review") {
    return <Review transcript={phase.transcript} items={phase.items} onStartOver={startOver} />;
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
        <div className="capture">
          {/* Voice capture arrives in slice 4; until then the mic opens typing. */}
          <MicButton label="Tap to talk" onClick={() => setPhase({ name: "typing" })} />
          <p className="capture__hint">Tap to talk</p>
          <button type="button" className="link" onClick={() => setPhase({ name: "typing" })}>
            Type instead
          </button>
        </div>
      )}
    </section>
  );
}
