import { dueLabel } from "../format";
import { BookmarkIcon, ClockIcon, PersonIcon } from "../icons";
import type { DraftItem } from "../types";

export function ItemCard({ item }: { item: DraftItem }) {
  const isMemory = item.kind === "memory";
  const when = isMemory ? null : dueLabel(item);
  return (
    <article className={`card card--${item.kind}`}>
      <div className="card__kind">
        {isMemory ? <BookmarkIcon /> : <ClockIcon />}
        <span>{isMemory ? "Memory" : "Reminder"}</span>
      </div>
      <p className="card__text">{item.text}</p>
      {(item.person || when) && (
        <div className="card__meta">
          {item.person && (
            <span className="card__person">
              <PersonIcon />
              {item.person}
            </span>
          )}
          {when && <span>{when}</span>}
        </div>
      )}
    </article>
  );
}
