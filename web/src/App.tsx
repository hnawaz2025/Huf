import { useEffect, useState } from "react";
import { listItems } from "./api";
import { NavBar, type Tab } from "./components/NavBar";
import { AskIcon, HomeIcon } from "./icons";
import { AskHuf, type Turn } from "./screens/AskHuf";
import { Home } from "./screens/Home";
import type { Item } from "./types";

type TabId = "home" | "ask";

const TABS: Tab<TabId>[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "ask", label: "Ask Huf", icon: <AskIcon /> },
];

export function App() {
  const [tab, setTab] = useState<TabId>("home");
  const [items, setItems] = useState<Item[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]); // Ask Huf chat — kept across tabs, cleared on refresh
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
        {tab === "home" && <Home items={items} onSaved={refresh} />}
        {tab === "ask" && <AskHuf turns={turns} setTurns={setTurns} />}
      </main>
      <NavBar tabs={TABS} current={tab} onChange={setTab} />
    </div>
  );
}
