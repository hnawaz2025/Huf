import { useEffect, useState } from "react";
import { listItems } from "./api";
import { Home } from "./screens/Home";
import type { Item } from "./types";

export function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = () =>
    listItems()
      .then((all) => {
        setItems(all);
        setLoadError(null);
      })
      .catch((e: Error) => setLoadError(e.message));

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">
          huf<span className="logo__dot">.</span>
        </span>
      </header>
      {loadError && (
        <p className="banner" role="alert">
          {loadError}
        </p>
      )}
      <main className="screen">
        <Home items={items} onSaved={refresh} />
      </main>
    </div>
  );
}
