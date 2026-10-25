import type { ReactNode } from "react";

export interface Tab<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  current: T;
  onChange: (id: T) => void;
}

export function NavBar<T extends string>({ tabs, current, onChange }: Props<T>) {
  return (
    <nav className="nav" aria-label="Huf">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`nav__tab${t.id === current ? " is-on" : ""}`}
          aria-current={t.id === current ? "page" : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
