import type { ReactNode } from "react";
import { dueLabel } from "../format";
import { BookmarkIcon, ClockIcon, PersonIcon } from "../icons";
import type { DraftItem } from "../types";

interface Props {
  item: DraftItem;
  actions?: ReactNode; // e.g. Edit / Remove on Review
  children?: ReactNode; // e.g. the person chooser
}

export function ItemCard({ item, actions, children }: Props) {
  const isMemory = item.kind === "memory";
  const when = isMemory ? null : dueLabel(item);
  return (
    <article className={`card card--${item.kind}`}>
      <div className="card__top">
        <div className="card__kind">
          {isMemory ? <BookmarkIcon /> : <ClockIcon />}
          <span>{isMemory ? "Memory" : "Reminder"}</span>
        </div>
        {actions && <div className="card__actions">{actions}</div>}
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
      {children}
    </article>
  );
}
