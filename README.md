# huf.

**Say it once. Huf remembers.**

Huf is a voice-first personal memory assistant. You speak naturally; Huf separates what you said into **memories** (facts worth keeping) and **reminders** (things you need to do), linked to the people involved. You review and edit before anything is saved. Later you can ask Huf a question and it answers **only from what you saved**, showing the items it used.

Built for Devpost's *Build With AI: Basics* with the Devpost Learn skill pack. The planning documents are in [`devpost/`](devpost/): [scope](devpost/scope.md), [PRD](devpost/prd.md), [spec](devpost/spec.md), and [build checklist](devpost/checklist.md).

## How it works

| Piece | What it does |
|---|---|
| `web/` — React + TypeScript + Vite | The app: Home (mic, review), Memories, Ask Huf. Uses Chrome's Web Speech API for live captions. Never talks to Claude directly. |
| `server/` — Python + FastAPI | Holds the Claude API key, asks Claude to sort transcripts and answer questions, and saves items. |
| `server/huf.db` — SQLite | Every saved memory and reminder. Survives refreshes and restarts. |

- **Sorting:** the transcript plus the device's date and timezone go to Claude Sonnet 5.5 with a Pydantic schema (structured outputs), so the reply always has the same shape. Relative dates ("Friday", "tomorrow") resolve from the device's date; vague times ("tomorrow morning") are never turned into a clock time.
- **Answering:** Claude receives every saved item with its ID and must cite the IDs it used. The server drops any ID that doesn't exist and, if nothing relevant was found, returns "I don't have anything saved about that yet." The cards shown under an answer come from the database, not from Claude.

## Requirements

- macOS or Linux, **Google Chrome** (voice uses Chrome's speech recognition; typing works in any browser)
- **Node.js** 20+ and **Python** 3.10+
- A **Claude API key** from <https://platform.claude.com>

## Setup

```bash
# server
cd server
python3 -m venv .venv            # any Python 3.10+
.venv/bin/pip install -r requirements.txt
cp .env.example .env             # then put your key in server/.env

# app
cd ../web
npm install
```

`server/.env` is git-ignored. The key stays on the server and is never sent to the browser.

## Run

Two terminals:

```bash
# terminal 1 — API on http://localhost:8000
cd server && .venv/bin/uvicorn main:app --reload --port 8000

# terminal 2 — app on http://localhost:5173
cd web && npm run dev
```

Open **http://localhost:5173** in Chrome. For the phone layout: DevTools → Toggle device toolbar → **iPhone 15 Pro**. The first time you tap the mic, allow microphone access. `localhost` counts as a secure page, so no HTTPS setup is needed.

## Demo

To start from a clean first-use screen, stop the API server, delete `server/huf.db`, and start it again.

1. **Brain dump** — tap the mic: *"I need to return my Amazon package by Friday, call the dentist tomorrow morning, and pay rent on the first of every month."* → three reminders with dates; rent labeled monthly. Save.
2. **Casual memory** — *"Sarah from work told me she's moving to Seattle in December, and I promised to send her an article tomorrow."* → one memory and one reminder, both linked to Sarah from work. Edit if needed, then **Save both**.
3. **Recall** — on **Ask Huf**: *"What did Sarah from work tell me, and do I owe her anything?"* → an answer drawn from the saved items, with those items shown underneath.

## Tests

```bash
cd server
.venv/bin/pytest -q                       # storage, routes, date guardrails, grounding (Claude stubbed)
.venv/bin/python scripts/demo_check.py    # the three demo cases against real Claude on a throwaway DB
```

`demo_check.py` calls the real API (a few cents per run) and never touches `huf.db`.

```bash
cd web
npm run build                             # type-check + production build
```

## Project structure

```
server/
  main.py          FastAPI routes (/api/extract, /api/items, /api/ask, /api/health)
  llm.py           Claude prompts, structured outputs, date guardrails
  db.py            SQLite storage (one `items` table)
  schemas.py       Pydantic models shared by the API and Claude's output
  tests/           pytest suite
  scripts/         demo_check.py
web/src/
  App.tsx          tabs and shared state
  screens/         Home, Review, Memories, AskHuf
  components/      MicButton, ItemCard, ItemEditor, NavBar
  useSpeech.ts     Web Speech API wrapper with friendly errors
  api.ts           calls to the server
  styles.css       design tokens and styles
devpost/           planning documents
```

## Limits of this proof of concept

- Runs locally, for one person, on one device. No accounts or sync.
- Reminders are not delivered as notifications; recurrence is a label.
- Voice capture needs Chrome (or Safari); typing works everywhere.

## License

[MIT](LICENSE). The Devpost Learn skill pack in `.agents/skills/` and `agent/skills/` is © Devpost, also MIT-licensed; its original notice is included alongside it.
