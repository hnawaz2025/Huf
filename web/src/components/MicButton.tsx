import { MicIcon } from "../icons";

interface Props {
  listening?: boolean;
  onClick: () => void;
  label: string;
}

/** Huf's signature: a single calm button that comes alive while listening. */
export function MicButton({ listening = false, onClick, label }: Props) {
  return (
    <button
      type="button"
      className={`mic${listening ? " mic--live" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={listening}
    >
      <span className="mic__ring" aria-hidden />
      <span className="mic__ring mic__ring--2" aria-hidden />
      <span className="mic__core">
        <MicIcon />
      </span>
    </button>
  );
}
