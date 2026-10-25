import { Home } from "./screens/Home";

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">
          huf<span className="logo__dot">.</span>
        </span>
      </header>
      <main className="screen">
        <Home />
      </main>
    </div>
  );
}
