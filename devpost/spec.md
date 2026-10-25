---
doc: spec
status: approved
---

# Huf — Technical Spec

## How This Works, In Plain Language

Huf has three pieces, all running on your Mac:

1. **The app** — what you see in Chrome: Home, Memories, Ask Huf, the mic. It's written in **TypeScript** with **React** (a library for building screens out of reusable pieces). It uses Chrome's built-in **Web Speech API** to turn your voice into live captions. It never talks to Claude directly.
2. **The server** — a small **Python** program using **FastAPI**. It holds your **API key** (the password for Claude) in a private `.env` file, so it never reaches the browser. It does three jobs: asks Claude to sort a transcript into items, saves/edits/deletes items, and asks Claude to answer questions from saved items.
3. **The database** — **SQLite**, a database that is just one file (`server/huf.db`) on your laptop. Every saved memory and reminder lives there, so it survives refreshes and restarts.

**Capturing:** you speak → Chrome turns speech into text → the app sends the text plus today's date to the server → the server asks Claude to return items in a fixed shape (a **Pydantic** class — Claude's reply is guaranteed to match it) → the app shows them for review → only when you tap Save does the server write them to SQLite.

**Asking:** you ask a question → the server sends Claude *every* saved item (each with an ID) plus your question → Claude must answer only from those items and list the IDs it used → the server throws away any ID that doesn't exist and sends back the answer plus the real cards. If nothing matches, Huf says "I don't have anything saved about that yet."

**Why this shape:** two programs and one file is the smallest setup that keeps your key secret, keeps data across refreshes, and puts the interesting logic — extraction, storage, retrieval — in Python, where you wanted to learn it. No agent frameworks, no vector database (with dozens of items, giving Claude everything is simpler and more accurate than searching), no cloud.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. **Open Huf** → Chrome loads the app from the Vite dev server → app calls `GET /api/items` → server reads SQLite → first use: no items, so Home shows only greeting + mic.
2. **Tap mic** → `useSpeech` starts Chrome speech recognition (asks for mic permission the first time) → interim results stream into live captions.
3. **Say the Sarah sentence** → captions update as you speak.
4. **Tap Done** → recognition stops → app shows "Making sense of your thoughts…" → `POST /api/extract` with `{transcript, today, timezone}`.
5. **Server extracts** → `llm.extract_items()` calls Claude Sonnet 5.5 with the transcript, today's date/weekday/timezone, and the `Extraction` schema → validates dates → returns draft items (not saved) → app shows **Review**: transcript on top, one memory card, one reminder card.
6. **Edit/remove, tap Save both** → `POST /api/items` with the remaining drafts + transcript → server inserts rows into SQLite, returns them with IDs → app shows a brief "Saved" confirmation and returns Home → Coming up / Recently remembered re-render from the returned items.
7. **Open Memories** → app lists items from `GET /api/items`; tap one → edit (`PATCH /api/items/{id}`), delete (`DELETE /api/items/{id}`), or toggle Pending/Completed (`PATCH` with `status`).
8. **Refresh** → step 1 again; items come back from SQLite.
9. **Ask Huf** (typed or via the same mic) → `POST /api/ask` with `{question, today, timezone}` → server loads all items → if none, returns the honest empty answer without calling Claude → else `llm.answer_question()` sends items (with IDs, status, dates) + question with the `Answer` schema → server keeps only IDs that exist → returns `{answer, items}` → app shows the chat bubble and the cards beneath.
10. **Brain dump** → same path as steps 2–6; Claude returns three reminders (Friday → a real date; "tomorrow morning" → tomorrow's date with `due_text` "tomorrow morning", no time; rent → `recurrence: "monthly"`).

## Stack

| Piece | Choice | Why | Docs |
|---|---|---|---|
| App language | TypeScript | Browsers run JavaScript; types catch mistakes early. Learner agreed. | https://www.typescriptlang.org/docs/ |
| UI library | React 18 | Learner's choice; screens built from reusable pieces. | https://react.dev/ |
| Dev server / build | Vite | Fast local dev server; proxies `/api` to Python so there's no cross-origin setup. | https://vite.dev/guide/ |
| Styling | Plain CSS with CSS variables (one `styles.css`) | Fewer dependencies (learner priority); the PRD's look is restrained enough not to need a CSS framework. *Implementation detail, not a learner decision.* | — |
| Font | Inter, bundled locally via `@fontsource-variable/inter` | PRD asks for Inter; bundling avoids a network dependency during recording. | https://fontsource.org/fonts/inter |
| Speech | Web Speech API (`webkitSpeechRecognition`) in Chrome | Only free option with live captions. Learner chose Chrome on Mac for the demo. | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| Server | Python 3.12 + FastAPI + Uvicorn | Learner's choice (knows Python). | https://fastapi.tiangolo.com/ |
| Data validation | Pydantic v2 (comes with FastAPI) | Same classes define API shapes *and* Claude's output shape. | https://docs.pydantic.dev/ |
| Database | SQLite via Python's built-in `sqlite3` | Learner agreed; one file, no server, no ORM. | https://docs.python.org/3/library/sqlite3.html |
| AI | Claude **Sonnet 5.5** (`claude-sonnet-5-5`) via the official `anthropic` Python SDK | Learner chose Sonnet. Structured outputs via `client.messages.parse(..., output_format=<PydanticModel>)`. | https://platform.claude.com/docs/en/build-with-claude/structured-outputs.md |
| Secrets | `python-dotenv` loading `server/.env` | Keeps `ANTHROPIC_API_KEY` out of code and git. | https://pypi.org/project/python-dotenv/ |
| Tests | `pytest` (server) + `tsc` type check (app) | Proportional checks; no browser test framework. | https://docs.pytest.org/ |

**Python version:** use the existing Python 3.12.11 at `/usr/local/bin/python3.12` (Intel build, runs under Rosetta) to create `server/.venv`. No new install; the global `python3` and Anaconda are left alone.

**Verify early in the build (unconfirmed from here):**
- Whether `client.messages.parse()` accepts `output_config={"effort": "low"}` alongside `output_format=`; if not, use `messages.create` with `output_config={"format": {...}, "effort": ...}` and parse JSON with the Pydantic model.
- Whether the server-side fallback (`fallbacks="default"` with beta `server-side-fallback-2026-07-01`) works with `parse()` (likely needs `client.beta.messages.parse`). If not, keep plain `parse()` and treat `stop_reason == "refusal"` as a normal error state.

## Where It Runs and How Someone Tries It

**Runs locally on the learner's Mac.** No deployment (optional; not chosen).

Requirements: Node (Apple Silicon, already installed), Python 3.12 in `server/.venv`, a Claude API key from https://platform.claude.com in `server/.env`, Google Chrome.

**First-time setup**
```
cd server
/usr/local/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # then put your key in .env — never paste it in chat
cd ../web
npm install
```

**Start (two terminals)**
```
# terminal 1
cd server && .venv/bin/uvicorn main:app --reload --port 8000
# terminal 2
cd web && npm run dev
```
Open **http://localhost:5173** in Chrome → DevTools → Toggle device toolbar → **iPhone 15 Pro** (393×852). `localhost` counts as secure, so the mic works without HTTPS.

**Demo recording (for `6-ship`):** start from an empty database (stop the server, delete `server/huf.db`, restart) so first-use Home shows. Record: Sarah capture → review → save → Memories → refresh → Ask Huf → brain dump. Required submission: 1–3 min video + public GitHub repo.

## Look and Feel

From `prd.md > Look and Feel` — no new decisions.

- **Tokens in `web/src/styles.css`:** `--ivory` (background, ~#F8F5EE), `--surface` (cards, slightly lighter), `--ink` (deep indigo text, ~#1F1D47), `--muted` (secondary text), `--lavender` (accents, ~#B9B0DA), `--lavender-soft`, `--line` (hairline borders). Reminder accent: a warm muted ochre used sparingly for the clock icon. Exact hex values may be tuned during build.
- **Type:** Inter only. Weights 400/500/600/700. Greeting ~28px/600, section labels 11–12px uppercase with letter-spacing, body 15–16px. Hierarchy from size, weight, and spacing — not color or boxes.
- **Surfaces:** flat; 1px hairline borders; radius 8–10px on cards (not pills); at most one very soft shadow on the bottom sheet.
- **Layout:** single column, 20px side padding, generous vertical rhythm (8px grid). Bottom nav fixed, three text+icon tabs.
- **Item types:** memory = small bookmark icon + lavender left rule; reminder = small clock icon + ochre left rule; completed reminders muted with strikethrough.
- **Motion:** the mic is the signature — on listen, it scales ~1.08 and emits two soft lavender rings pulsing outward; captions fade in word groups. Elsewhere only short (150–200ms) fades/slides. Respect `prefers-reduced-motion`.
- **Copy tone:** short, warm, plain. "What's on your mind?", "Tap to talk", "Making sense of your thoughts…", "I don't have anything saved about that yet."
- **Avoid:** gradients, glowing AI icons, heavy shadows, pill-shaped everything, dashboard grids.
- Icons: small inline SVGs (no icon library).

## Components

### App Shell and Navigation
`App.tsx` holds the current tab (`home | memories | ask`) and the item list, loaded once from `GET /api/items` and refreshed after any change. `NavBar` renders the three tabs. No router; no settings icon.
PRD ref: `prd.md > Screens and Layout`.

### Speech Capture (`useSpeech` hook)
Wraps `webkitSpeechRecognition` with `continuous = true`, `interimResults = true`, `lang = "en-US"`. Exposes `start()`, `stop()`, `transcript` (final + interim), `status` (`idle | listening | error`), and a friendly `error` (`unsupported | permission-denied | no-speech | network | other`). Used by Home and Ask Huf.
PRD ref: `prd.md > Capture by Voice`, `prd.md > Ask Huf`, `prd.md > States and Boundaries`.

### Home Screen
States: **idle** (greeting, `MicButton`, "Tap to talk", "Type instead", Coming up, Recently remembered) → **listening** (expanded mic, live captions, Done) → **processing** ("Making sense of your thoughts…") → **review** (renders `ReviewScreen`) → back to idle with a short "Saved" confirmation. Errors show inline with "Try again" and "Type instead". Coming up = up to 3 pending reminders sorted by `due_date` (nulls last); Recently remembered = 2 newest memories. Sections hidden when empty.
PRD ref: `prd.md > Capture by Voice`, `prd.md > Typed Capture`, `prd.md > Home at a Glance`.

### Typed Input
"Type instead" swaps the mic area for a textarea + Send; submitted text follows the same processing → review path.
PRD ref: `prd.md > Typed Capture`.

### Review Screen
Shows the transcript, then one `ItemCard` per draft in edit mode (`ItemEditor`: text, kind, person, due text/date, recurrence) with a remove control. Person chooser: if a draft's `person` shares its first name (case-insensitive) with more than one distinct saved `person` value — or with one saved value that differs from what was said — the card shows those saved people plus "Keep as <spoken>" as small choices; selecting one sets `person`. Computed in the app from the loaded items; no Claude call. Save button label reflects count ("Save both", "Save 3 items", "Save"). Disabled when no items remain. On failure, keeps drafts and shows "Couldn't save — try again".
PRD ref: `prd.md > Review Before Saving`, `prd.md > Sorting Thoughts into Memories and Reminders`.

### Item Card and Editor
`ItemCard` displays kind icon, text, person, due/recurrence, status. `ItemEditor` edits the same fields (reused in Review and Memories details).
PRD ref: `prd.md > Sorting Thoughts into Memories and Reminders`, `prd.md > Memories`.

### Memories Screen
Lists all items (newest first), typed and with person. Tapping opens a bottom-sheet detail with Edit, Delete, and (reminders) a Pending/Completed toggle. Empty state: a calm line pointing to Home.
PRD ref: `prd.md > Memories`.

### Ask Huf Screen
Chat-style list (in memory only — cleared on refresh). Input row with text field + small mic (uses `useSpeech`; tapping mic again or Done sends). Each answer shows Huf's text and the cited `ItemCard`s beneath ("Based on"). Shows a typing indicator while waiting; errors show inline with retry.
PRD ref: `prd.md > Ask Huf`.

### API Client (`web/src/api.ts`)
Typed `fetch` wrappers for every endpoint; adds `today` (YYYY-MM-DD, local), `weekday`, and `timezone` (`Intl.DateTimeFormat().resolvedOptions().timeZone`) to extract/ask calls. Turns non-2xx responses into a friendly error message.
PRD ref: supports all.

### Server Routes (`server/main.py`)
FastAPI app with the endpoints listed under **External Services and Dependencies → Huf server API**. Loads `.env`, initializes the DB on startup.
PRD ref: supports all.

### Storage (`server/db.py`)
Opens `huf.db`, creates the `items` table if missing, and provides `list_items`, `insert_items`, `update_item`, `delete_item`, `get_items_by_ids`. Plain SQL with parameters.
PRD ref: `prd.md > States and Boundaries` (Persistence).

### Extraction (`server/llm.py → extract_items`)
Builds the extraction prompt: today's date, weekday, timezone; rules — split into separate items; `memory` for facts, `reminder` for things the user must do; keep person exactly as said ("Sarah from work"), `null` if none, never merge with another person; resolve relative dates to `due_date` (ISO) but keep the spoken phrase in `due_text`; never invent a time; set `recurrence` only when said ("monthly"). Calls `client.messages.parse(model="claude-sonnet-5-5", output_format=Extraction, ...)`. Post-checks: drop items with empty text; null out an unparseable `due_date`; memories get no `status`.
PRD ref: `prd.md > Sorting Thoughts into Memories and Reminders`.

### Grounded Answering (`server/llm.py → answer_question`)
Sends all items as a JSON list (`id, kind, text, person, due_text, due_date, recurrence, status`) plus today's date and the question. Rules: answer only from these items; cite every item used in `used_item_ids`; describe completed reminders as completed, not owed; if nothing relevant, set `found = false`. Calls `parse(output_format=Answer)`. Server then: keeps only IDs that exist; if `found` is false or no valid IDs remain, returns exactly "I don't have anything saved about that yet." with no cards.
PRD ref: `prd.md > Ask Huf`.

## Data Model

**SQLite table `items`** (in `server/huf.db`)

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID4 string |
| `kind` | TEXT | `memory` or `reminder` |
| `text` | TEXT | "Sarah from work is moving to Seattle in December" |
| `person` | TEXT NULL | exactly as spoken, e.g. "Sarah from work" |
| `due_text` | TEXT NULL | spoken phrase, e.g. "tomorrow morning" |
| `due_date` | TEXT NULL | ISO date `YYYY-MM-DD`, no time |
| `recurrence` | TEXT NULL | e.g. "monthly"; label only |
| `status` | TEXT NULL | `pending` / `completed` for reminders; NULL for memories |
| `source_transcript` | TEXT | what was said when it was captured |
| `created_at`, `updated_at` | TEXT | ISO timestamps |

**Pydantic shapes (`server/schemas.py`)**
- `DraftItem`: `kind: Literal["memory","reminder"]`, `text: str`, `person: str | None`, `due_text: str | None`, `due_date: str | None`, `recurrence: str | None`.
- `Extraction` (Claude output): `items: list[DraftItem]`.
- `Answer` (Claude output): `found: bool`, `answer: str`, `used_item_ids: list[str]`.
- `Item` (API): `DraftItem` + `id`, `status`, `source_transcript`, `created_at`, `updated_at`.

**Where each piece of data lives**

| Data | Lives in | Updated by | After refresh / restart |
|---|---|---|---|
| Saved memories & reminders | SQLite `items` | Save, edit, delete, status toggle | Still there |
| Review drafts | React state on Home | Extraction result, your edits | Gone (never saved) |
| Live transcript | React state (`useSpeech`) | Speech recognition | Gone |
| Ask Huf chat | React state | Each question/answer | Gone (by PRD decision) |
| API key | `server/.env` | You, once | Stays; git-ignored |

## File Structure

```
Huf/
├── README.md                 # what Huf is, setup, run, demo steps
├── .gitignore                # learner profile, .env, .venv, node_modules, huf.db, dist
├── devpost/                  # planning docs (scope, prd, spec, checklist, app map)
├── web/                      # the app (TypeScript + React + Vite)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts        # dev server; proxies /api → http://localhost:8000
│   └── src/
│       ├── main.tsx          # mounts <App/>, imports Inter + styles.css
│       ├── App.tsx           # tab state, item list, top-level layout
│       ├── styles.css        # design tokens + all styles
│       ├── types.ts          # Item, DraftItem, Answer (mirror server shapes)
│       ├── api.ts            # fetch wrappers; adds today/timezone
│       ├── useSpeech.ts      # Web Speech API wrapper + friendly errors
│       ├── icons.tsx         # small inline SVG icons (mic, bookmark, clock, nav)
│       ├── components/
│       │   ├── NavBar.tsx
│       │   ├── MicButton.tsx # the signature mic + listening rings
│       │   ├── ItemCard.tsx
│       │   └── ItemEditor.tsx
│       └── screens/
│           ├── Home.tsx      # idle / listening / processing / review flow
│           ├── Review.tsx
│           ├── Memories.tsx  # list + detail sheet
│           └── AskHuf.tsx
└── server/                   # the server (Python + FastAPI)
    ├── requirements.txt      # fastapi, uvicorn, anthropic, python-dotenv, pytest
    ├── .env.example          # ANTHROPIC_API_KEY=your-key-here
    ├── main.py               # FastAPI routes
    ├── schemas.py            # Pydantic models (API + Claude output shapes)
    ├── db.py                 # SQLite access
    ├── llm.py                # Claude prompts + extract_items / answer_question
    ├── tests/
    │   ├── test_db.py        # save/edit/delete/status round-trips
    │   ├── test_routes.py    # endpoints with Claude stubbed
    │   └── test_grounding.py # invented IDs dropped; found=false → honest answer
    └── scripts/
        └── demo_check.py     # runs the 3 demo cases against real Claude and checks results
```

## External Services and Dependencies

### Claude API (Anthropic)
- **Model:** `claude-sonnet-5-5` (learner's choice). Pricing: $2 / M input tokens, $10 / M output tokens. Each Huf call is roughly 1–3K tokens → well under a cent per call. Docs: https://platform.claude.com/docs/en/about-claude/models/overview.md · pricing: https://platform.claude.com/docs/en/about-claude/pricing.md
- **Auth:** `ANTHROPIC_API_KEY` in `server/.env`; the SDK reads it from the environment (`anthropic.Anthropic()`).
- **Call shape (both functions):** `client.messages.parse(model="claude-sonnet-5-5", max_tokens=4000, system=<rules>, messages=[{"role":"user","content":<payload>}], output_format=<Extraction|Answer>)` → `response.parsed_output` is a validated Pydantic object. Check `response.stop_reason` first (`refusal` / `max_tokens` → error state). Effort `low` intended for speed (verify, see Stack).
- **Refusal fallback:** enabled by default — `fallbacks="default"` with beta `server-side-fallback-2026-07-01` (Claude API only). Learner may turn it off. Docs: https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback
- **Errors:** catch `anthropic.RateLimitError`, `anthropic.APIStatusError`, `anthropic.APIConnectionError` (most-specific first) → HTTP 502 with a friendly message. SDK retries 429/5xx twice automatically.
- **SDK docs:** https://github.com/anthropics/anthropic-sdk-python

### Web Speech API (Chrome)
Free, no key. In Chrome, audio is sent to Google's speech service for transcription. Requires a secure context (`localhost` qualifies). Not available in Firefox. Docs: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

### Huf server API (our own)

| Method & path | Body | Returns |
|---|---|---|
| `GET /api/items` | — | `Item[]` (newest first) |
| `POST /api/extract` | `{transcript, today, weekday, timezone}` | `{items: DraftItem[]}` — nothing saved |
| `POST /api/items` | `{items: DraftItem[], source_transcript}` | `Item[]` saved (reminders start `pending`) |
| `PATCH /api/items/{id}` | any of `text, kind, person, due_text, due_date, recurrence, status` | `Item` |
| `DELETE /api/items/{id}` | — | `204` |
| `POST /api/ask` | `{question, today, weekday, timezone}` | `{answer, items: Item[]}` |
| `GET /api/health` | — | `{ok: true, has_key: bool}` |

## Important Failure Modes

- **Mic permission denied** → "Huf needs microphone access to listen. You can allow it in Chrome's address bar, or type instead." + Try again / Type instead. (`prd.md > States and Boundaries`)
- **No speech heard / speech service error / unsupported browser** → plain explanation + Try again / Type instead; unsupported browser shows typing only.
- **Claude call fails (network, rate limit, refusal, bad key)** → "Huf couldn't make sense of that right now." The transcript stays on screen with Try again, so you never re-speak. Ask Huf shows the same inline with retry.
- **Claude returns nothing to save** → Review says "Huf didn't find anything to save in that." + Try again / Type instead.
- **Server not running** → app shows "Can't reach Huf's server — is it running?" (helps during development and recording).
- **Missing API key** → `/api/health` reports it; server logs a clear startup warning.

## What Was Simplified and Why

- **Give Claude all saved items** instead of a vector database or search index — dozens of items fit easily; simpler and more accurate. A fuller version would add embeddings and retrieval once there are thousands of items.
- **One SQLite table** instead of separate people/items tables — person is stored as spoken text, matching the "keep context as given" decision. A fuller version would add a `people` table to group "Sarah from work" across items.
- **No router library** — three tabs as React state. Deep links would need React Router.
- **Recurrence is a label** (`"monthly"`), not a schedule — per scope cut.
- **Local only, no deployment** — the demo is recorded in desktop Chrome at iPhone size (learner's choice). A phone demo would need HTTPS or a deployment.
- **Ask Huf chat not persisted** — PRD decision.
- **Nothing simulated:** all extraction and answers come from real Claude calls on real saved data. No sample data.

## Decisions and Open Issues

**Learner decisions**
- Python (FastAPI) server, TypeScript + React app — comfort with Python; "simple, reliable, and easy to understand."
- SQLite on the server — accepted recommendation; data survives refresh and restart.
- No agent frameworks, no vector DB, minimal dependencies, no cloud infrastructure.
- Claude as provider, **Sonnet 5.5** as model.
- Demo in Chrome on Mac at iPhone size; no deployment.
- Graceful handling of mic permission, transcription errors, and AI failures.
- **Responsible AI: keep what the plan already covers** — human review before saving, answers grounded in saved items with server-checked citations, honest "nothing saved" fallback, visible source cards, people kept as spoken, no invented times, API key server-side. Considered at review and **not added** for this version: a first-use data-flow notice (Chrome/Google transcription, Claude processing), prompt-injection hardening and test, no-transcript logging rule, AI-answer labeling, delete-all-data control, guidance on sensitive third-party info. Learner: "we cover most of it so stick to what we already have."

- Person chooser on Review when a spoken name matches multiple saved people (added at build planning; see `prd.md > States and Boundaries`).
- Use an existing compatible Python rather than installing a new one (build planning).

**Implementation details derived from those (agent)**
- Plain CSS instead of Tailwind; Inter bundled locally; inline SVG icons.
- Vite proxy for `/api`; refusal fallback enabled by default (learner may decline).
- Python 3.12.11 (existing `/usr/local/bin/python3.12`, Intel build under Rosetta) in a project venv — learner asked to reuse an existing version.

**The useful unknown — "How do I make sure Huf's answers reflect the actual saved data and don't hallucinate?"** (learner's stated learning interest)
Clarified by design: Claude receives only saved items with IDs, must return `found` + `used_item_ids` in a fixed schema, and the server — not Claude — decides which cards appear, dropping any ID that doesn't exist and replacing a not-found answer with the fixed honest sentence. **Checked during build** by: (1) `test_grounding.py` with stubbed Claude responses containing fake IDs and `found=false`; (2) the live PRD check — edit "Seattle" → "Portland" and confirm the answer changes; (3) asking about something never saved.

**Related learning thread:** structured outputs (Pydantic `Extraction`) and persistent retrieval (SQLite + all-items context) are exercised directly in the extraction and answering components — no extra tooling added for learning.

**To verify early in the build**
- `parse()` + `effort` combination, and fallback support with `parse()` (see Stack).
- Web Speech API behavior on this Mac/Chrome (permission prompt, `no-speech` timing).

**Carried from `prd.md > Open Questions`**
- Ask Huf voice input reuses `useSpeech` with a small mic in the input row — resolved here.
