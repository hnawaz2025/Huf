import { useEffect, useState } from "react";
import { health, listItems } from "./api";
import { NavBar, type Tab } from "./components/NavBar";
import { AskIcon, HomeIcon, StackIcon } from "./icons";
import { AskHuf, type Turn } from "./screens/AskHuf";
import { Home } from "./screens/Home";
import { Memories } from "./screens/Memories";
import type { Item } from "./types";

type TabId = "home" | "memories" | "ask";

const TABS: Tab<TabId>[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "memories", label: "Memories", icon: <StackIcon /> },
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
    health()
      .then((h) => {
        if (!h.has_key) setLoadError("Huf’s server is missing its Claude API key — add it to server/.env and restart.");
        else refresh();
      })
      .catch((e: Error) => setLoadError(e.message));
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
        {tab === "memories" && <Memories items={items} onChanged={refresh} onGoHome={() => setTab("home")} />}
        {tab === "ask" && <AskHuf turns={turns} setTurns={setTurns} />}
      </main>
      <NavBar tabs={TABS} current={tab} onChange={setTab} />
    </div>
  );
}
