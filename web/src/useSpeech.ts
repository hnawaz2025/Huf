import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Chrome's Web Speech API, wrapped for Huf.
 * Live captions while you talk; keeps listening through pauses until you tap Done;
 * every failure becomes a plain-language message with a way forward.
 */

// Minimal typings — the Web Speech API isn't in TypeScript's DOM lib.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>;
}
export interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

export type SpeechErrorKind = "unsupported" | "permission-denied" | "no-speech" | "no-mic" | "network" | "other";

export const SPEECH_MESSAGES: Record<SpeechErrorKind, string> = {
  unsupported: "Voice isn’t available in this browser. Try Chrome, or type instead.",
  "permission-denied":
    "Huf needs microphone access to listen. Allow it from the mic icon in Chrome’s address bar, or type instead.",
  "no-speech": "Huf didn’t hear anything. Try again a little closer to the mic, or type instead.",
  "no-mic": "No microphone was found. Connect one, or type instead.",
  network: "Chrome’s speech service couldn’t be reached. Check your connection, or type instead.",
  other: "Something went wrong while listening. Try again, or type instead.",
};

function errorKind(code: string): SpeechErrorKind | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "permission-denied";
    case "no-speech":
      return null; // a pause, not a failure — keep listening until Done
    case "audio-capture":
      return "no-mic";
    case "network":
      return "network";
    case "aborted":
      return null;
    default:
      return "other";
  }
}

function getCtor(): RecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>;
  // Dev-only test double so automated checks can drive this hook without a microphone.
  if (import.meta.env.DEV && typeof w.__hufFakeSpeech === "function") return w.__hufFakeSpeech as RecognitionCtor;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as RecognitionCtor | null;
}

export type SpeechStatus = "idle" | "listening" | "error";

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<SpeechErrorKind | null>(null);

  const rec = useRef<Recognition | null>(null);
  const committed = useRef(""); // text from earlier recognition sessions (Chrome restarts after pauses)
  const latest = useRef({ final: "", interim: "" });
  const stopping = useRef<((text: string) => void) | null>(null);
  const failed = useRef(false);

  const fullText = () => [committed.current, latest.current.final, latest.current.interim].join(" ").replace(/\s+/g, " ").trim();

  const fail = useCallback((kind: SpeechErrorKind) => {
    failed.current = true;
    setError(kind);
    setStatus("error");
    rec.current?.abort();
  }, []);

  const startSession = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return fail("unsupported");
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    latest.current = { final: "", interim: "" };

    r.onresult = (e) => {
      let fin = "";
      let mid = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += res[0].transcript;
        else mid += res[0].transcript;
      }
      latest.current = { final: fin, interim: mid };
      setFinalText([committed.current, fin].join(" ").trim());
      setInterim(mid.trim());
    };
    r.onerror = (e) => {
      const kind = errorKind(e.error);
      if (kind) fail(kind);
    };
    r.onend = () => {
      if (failed.current) return;
      const text = fullText();
      if (stopping.current) {
        const resolve = stopping.current;
        stopping.current = null;
        rec.current = null;
        setStatus("idle");
        resolve(text);
        return;
      }
      // Chrome ended on its own after a pause: keep what we have and keep listening.
      committed.current = text;
      latest.current = { final: "", interim: "" };
      try {
        r.start();
      } catch {
        fail("other");
      }
    };

    rec.current = r;
    try {
      r.start();
    } catch {
      fail("other");
    }
  }, [fail]);

  const start = useCallback(() => {
    committed.current = "";
    latest.current = { final: "", interim: "" };
    failed.current = false;
    stopping.current = null;
    setFinalText("");
    setInterim("");
    setError(null);
    setStatus("listening");
    startSession();
  }, [startSession]);

  /** Stop listening and get everything that was said. An empty result is reported as "no-speech". */
  const stop = useCallback(
    () =>
      new Promise<string>((resolve) => {
        const r = rec.current;
        const finish = (text: string) => {
          if (!text) fail("no-speech");
          resolve(text);
        };
        if (!r) return finish(fullText());
        stopping.current = finish;
        r.stop();
      }),
    [fail],
  );

  const cancel = useCallback(() => {
    failed.current = true; // suppress the restart in onend
    rec.current?.abort();
    rec.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  useEffect(() => () => rec.current?.abort(), []);

  return { status, finalText, interim, error, start, stop, cancel, supported: getCtor() !== null };
}
