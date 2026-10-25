import { useEffect, useRef, useState } from "react";
import { ask } from "../api";
import { ItemCard } from "../components/ItemCard";
import { MicButton } from "../components/MicButton";
import { SendIcon } from "../icons";
import type { Item } from "../types";
import { SPEECH_MESSAGES, useSpeech } from "../useSpeech";

export type Turn =
  | { id: number; role: "you"; text: string }
  | { id: number; role: "huf"; text: string; items: Item[] }
  | { id: number; role: "error"; text: string; question: string };

interface Props {
  turns: Turn[];
  setTurns: React.Dispatch<React.SetStateAction<Turn[]>>;
}

let nextId = 1;

/** A simple chat whose answers come only from saved items — with the cards shown as proof. */
export function AskHuf({ turns, setTurns }: Props) {
  const [question, setQuestion] = useState("");
  const [waiting, setWaiting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech();
  const listening = speech.status === "listening";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, waiting]);

  async function send(q: string, retry = false) {
    const text = q.trim();
    if (!text || waiting) return;
    setQuestion("");
    setTurns((ts) => {
      const kept = retry ? ts.filter((t) => !(t.role === "error" && t.question === text)) : ts;
      return retry ? kept : [...kept, { id: nextId++, role: "you", text }];
    });
    setWaiting(true);
    try {
      const res = await ask(text);
      setTurns((ts) => [...ts, { id: nextId++, role: "huf", text: res.answer, items: res.items }]);
    } catch (e) {
      setTurns((ts) => [...ts, { id: nextId++, role: "error", text: (e as Error).message, question: text }]);
    } finally {
      setWaiting(false);
    }
  }

  async function finishSpeaking() {
    const said = await speech.stop();
    if (said) send(said);
  }

  const heard = [speech.finalText, speech.interim].filter(Boolean).join(" ");

  return (
    <section className="ask">
      {turns.length === 0 && !waiting && (
        <div className="ask__intro">
          <h1 className="greeting">Ask Huf</h1>
          <p className="muted">Ask about anything you’ve told Huf — people, plans, promises. Answers come only from what you saved.</p>
        </div>
      )}

      <div className="chat" aria-live="polite">
        {turns.map((t) => {
          if (t.role === "you") {
            return (
              <p key={t.id} className="bubble bubble--you">
                {t.text}
              </p>
            );
          }
          if (t.role === "error") {
            return (
              <div key={t.id} className="bubble bubble--huf bubble--error" role="alert">
                <p>{t.text}</p>
                <button type="button" className="text-btn" onClick={() => send(t.question, true)}>
                  Try again
                </button>
              </div>
            );
          }
          return (
            <div key={t.id} className="answer">
              <p className="bubble bubble--huf">{t.text}</p>
              {t.items.length > 0 && (
                <>
                  <p className="eyebrow answer__based">Based on</p>
                  <div className="stack">
                    {t.items.map((i) => (
                      <ItemCard key={i.id} item={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
        {waiting && (
          <div className="bubble bubble--huf bubble--waiting" aria-label="Huf is thinking">
            <div className="dots" aria-hidden>
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {speech.status === "error" && speech.error && (
        <p className="voice-note" role="alert">
          {SPEECH_MESSAGES[speech.error]}
        </p>
      )}

      <form
        className="ask__input"
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
      >
        <input
          value={listening ? heard : question}
          readOnly={listening}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={listening ? "Listening…" : "Ask Huf…"}
          aria-label="Your question"
          enterKeyHint="send"
          className={listening ? "is-listening" : ""}
        />
        {listening || !question.trim() ? (
          <MicButton
            size="small"
            listening={listening}
            label={listening ? "Done — ask Huf" : "Ask by voice"}
            onClick={listening ? finishSpeaking : speech.start}
          />
        ) : (
          <button type="submit" className="ask__send" aria-label="Ask" disabled={waiting}>
            <SendIcon />
          </button>
        )}
      </form>
    </section>
  );
}
