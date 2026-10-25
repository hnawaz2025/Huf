import { ItemCard } from "../components/ItemCard";
import type { DraftItem } from "../types";

interface Props {
  transcript: string;
  items: DraftItem[];
  onStartOver: () => void;
}

export function Review({ transcript, items, onStartOver }: Props) {
  return (
    <section className="review" aria-labelledby="review-title">
      <p className="eyebrow">You said</p>
      <blockquote className="quote">“{transcript}”</blockquote>

      <h2 id="review-title" className="eyebrow review__heading">
        {items.length ? "Huf understood" : "Nothing to save"}
      </h2>
      {items.length ? (
        <div className="stack">
          {items.map((item, i) => (
            <ItemCard key={i} item={item} />
          ))}
        </div>
      ) : (
        <p className="muted">Huf didn’t find anything to save in that.</p>
      )}

      <div className="actions">
        <button type="button" className="btn btn--ghost" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </section>
  );
}
