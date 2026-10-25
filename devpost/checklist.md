---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (learner said "move on" after two prompts; can switch to learn anytime)

## Slices

- [x] **1. Type a thought and see Huf sort it into memory and reminder cards**
  Becomes usable: Open Huf in Chrome, tap "Type instead," enter the Sarah sentence, see "Making sense of your thoughts…" and then the transcript with one memory card and one reminder card (person "Sarah from work", reminder due tomorrow with its real date). The brain dump gives three reminders with resolved dates. Nothing is saved yet.
  Why now: This is half the kernel and the biggest unknown — real Claude structured outputs from Python. Bootstrapping (existing Python 3.12, venv, FastAPI, Vite/React, Inter, design tokens) happens here so every later slice lands on a running app. Typed input comes first because it exercises the kernel without depending on the microphone.
  PRD ref: `prd.md > Typed Capture`, `prd.md > Sorting Thoughts into Memories and Reminders`, `prd.md > The Core Journey` (steps 1, 4–5, 10)
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > Extraction (server/llm.py → extract_items)`, `spec.md > Typed Input`, `spec.md > Review Screen`, `spec.md > Item Card and Editor`, `spec.md > API Client (web/src/api.ts)`, `spec.md > File Structure`
  Build: Create `server/.venv` from the existing `/usr/local/bin/python3.12`; extend `.gitignore` (`.venv`, `node_modules`, `huf.db`, `dist`, `__pycache__`, `.DS_Store`); add `server/` (`requirements.txt`, `.env.example`, `schemas.py`, `llm.py` with `extract_items`, `main.py` with `/api/health` and `/api/extract`); scaffold `web/` with Vite + React + TS, Vite `/api` proxy, `styles.css` tokens, bundled Inter, `App.tsx` shell with NavBar, Home idle + typed input + processing state, read-only Review cards. Resolve the spec's "verify early" items: `parse()` with `effort`, and refusal fallback with `parse()`.
  Verify (mechanical): `GET /api/health` returns `has_key: true`; `curl` `POST /api/extract` with the Sarah sentence returns exactly 1 memory + 1 reminder, both with person "Sarah from work", reminder `due_date` = tomorrow; brain-dump sentence returns 3 reminders with Friday's date, tomorrow's date + `due_text` "tomorrow morning" and no time, and rent `recurrence` "monthly"; `curl` with `today` = 2026-12-31 (Thursday) and a different timezone resolves "tomorrow" and "Friday" to 2027-01-01 from the *request's* date, not the server clock; no item has an invented clock time; `pytest tests/test_dates.py` (server-side date validation) passes; `server/.env` is git-ignored and no key appears in `web/` or any tracked file; `npx tsc --noEmit` passes; headless Chrome screenshot of the first-use Home at 393×852 shows logo, greeting, mic, "Type instead" and no empty sections.
  Learner check: Start both servers, open http://localhost:5173 at iPhone 15 Pro size, tap "Type instead," type the Sarah sentence, and check that the two cards say what you meant and look like Huf rather than a generic AI app.
  Commit: `Sort typed thoughts into memory and reminder cards with Claude`

- [x] **2. Review, edit, and save — and it's still there after a refresh**
  Becomes usable: On Review you can edit any card's text, kind, person, or date, remove a card, and tap "Save both." If the person you named matches more than one saved person, the card lets you choose which one (or keep it as said). Huf confirms and returns Home, where the reminder appears under Coming up and the memory under Recently remembered. Refresh or restart the server: still there.
  Why now: Persistence is where the data model can be wrong, and the recall slice depends on real saved items. Completes the capture half of the core loop.
  PRD ref: `prd.md > Review Before Saving`, `prd.md > Home at a Glance`, `prd.md > States and Boundaries` (Persistence, First use, Ambiguous person)
  Spec ref: `spec.md > Storage (server/db.py)`, `spec.md > Data Model`, `spec.md > Review Screen`, `spec.md > Item Card and Editor`, `spec.md > Home Screen`, `spec.md > Server Routes (server/main.py)`
  Build: `db.py` (create `items` table, list/insert); `GET /api/items` and `POST /api/items`; `ItemEditor` with remove; person chooser on Review (`spec.md > Review Screen`); count-aware save button; "Saved" confirmation; Home Coming up (≤3 pending by due date) and Recently remembered (2 newest memories), hidden when empty; `tests/test_db.py`, `tests/test_routes.py` (Claude stubbed).
  Verify (mechanical): `pytest` passes; `curl` save two items, restart uvicorn, `GET /api/items` returns both with IDs and `status` "pending" on the reminder; `npx tsc --noEmit` passes; headless screenshot of Home with saved items shows both sections; with "Sarah from work" and "Sarah Chen" saved, a draft with person "Sarah" shows the chooser in a headless screenshot and saves the chosen person.
  Learner check: Type the Sarah sentence, change the reminder text slightly, save, see both items on Home, refresh the page, and confirm they're still there.
  Commit: `Review, edit, and save items to SQLite`

- [x] **3. Ask Huf about Sarah and get a grounded answer with the cards it used**
  Becomes usable: On the Ask Huf tab, type "What did Sarah from work tell me, and do I owe her anything?" and get a conversational answer mentioning Seattle in December and the article, with the memory and reminder cards beneath. Ask about something never saved and get "I don't have anything saved about that yet."
  Why now: This is the climax of the kernel and the demo. Building it third means the whole kernel works by typing before any voice or polish work.
  PRD ref: `prd.md > Ask Huf`, `prd.md > The Core Journey` (step 9)
  Spec ref: `spec.md > Grounded Answering (server/llm.py → answer_question)`, `spec.md > Ask Huf Screen`, `spec.md > Decisions and Open Issues` (the useful unknown)
  Build: `answer_question` with the `Answer` schema; `POST /api/ask` with the grounding check (drop unknown IDs, no Claude call when nothing is saved, honest fixed sentence when not found); `AskHuf.tsx` chat with typed input, typing indicator, "Based on" cards, inline error + retry; `tests/test_grounding.py`.
  Verify (mechanical): `pytest` passes, including stubbed answers with invented IDs (dropped) and `found=false` (fixed sentence, no cards); live `curl` `/api/ask` with the Sarah question returns an answer containing "Seattle" and "December" and the article, citing exactly the two real IDs; a never-saved question returns the fixed sentence with no items; saving a variant memory ("moving to Portland") and asking again changes the answer.
  Learner check: Ask Huf the Sarah question, check the answer and the cards under it, then ask about something you never told Huf.
  Commit: `Answer questions from saved items with grounded citations`

- [x] **4. Speak instead of typing — live captions, Done, and graceful mic errors**
  Becomes usable: Tap the mic on Home: it expands with lavender rings, your words appear as live captions, tap Done → same sorting and review as typing. The small mic on Ask Huf works the same way. Denied permission, silence, or an unsupported browser show a clear message with Try again / Type instead.
  Why now: **Essential, not polish** — working mic capture and transcription is required for the demo. It rides on a working kernel; adding it after slices 1–3 means a mic problem can't block the core. It's also the riskiest browser piece, so it comes before management and polish.
  PRD ref: `prd.md > Capture by Voice`, `prd.md > Ask Huf` (voice), `prd.md > States and Boundaries` (mic denied, transcription fails)
  Spec ref: `spec.md > Speech Capture (useSpeech hook)`, `spec.md > Home Screen`, `spec.md > Ask Huf Screen`, `spec.md > Look and Feel` (mic motion), `spec.md > Important Failure Modes`
  Build: `useSpeech.ts` (continuous + interim results, friendly error mapping); `MicButton.tsx` signature animation with `prefers-reduced-motion`; Home listening state with captions and Done; Ask Huf mic; error UI with Try again / Type instead.
  Verify (mechanical): `npx tsc --noEmit` and `npm run build` pass; headless Chrome renders the listening state and each error message (forced via the hook's error states) without console errors. Real speech recognition can't be automated here — the learner check is the evidence for it.
  Learner check: In Chrome at iPhone size, tap the mic, allow permission, say the Sarah sentence, watch the captions, tap Done, and confirm the same two cards appear. Then try the mic on Ask Huf.
  Commit: `Capture thoughts and questions by voice with live captions`

- [ ] **5. Browse, edit, delete, and complete items in Memories — and Huf knows**
  Becomes usable: The Memories tab lists everything saved, typed and with person. Tap an item to edit, delete, or toggle a reminder Pending ⇄ Completed. Mark "Send Sarah the article" done and Ask Huf says you already completed it. Edit Seattle → Portland and the answer changes.
  Why now: Completes the "find it in Memories" step of the journey and the status-aware recall the learner tied to accuracy. It depends on saving (2) and asking (3).
  PRD ref: `prd.md > Memories`, `prd.md > Ask Huf` (completed reminders, not hardcoded), `prd.md > States and Boundaries` (Empty Memories)
  Spec ref: `spec.md > Memories Screen`, `spec.md > Item Card and Editor`, `spec.md > Storage (server/db.py)`, `spec.md > Server Routes (server/main.py)`
  Build: `PATCH /api/items/{id}` and `DELETE /api/items/{id}`; `Memories.tsx` list + bottom-sheet detail with edit, delete, status toggle; empty state; completed styling; tests for patch/delete.
  Verify (mechanical): `pytest` passes; live `curl`: toggle the article reminder to completed, ask the Sarah question → answer describes it as completed; PATCH the memory to Portland → answer says Portland; DELETE an item → it's gone from `GET /api/items` and from answers; `npx tsc --noEmit` passes.
  Learner check: Open Memories, mark the article reminder done, ask Huf about Sarah again, then edit the memory to a different city and ask once more.
  Commit: `Manage memories and reminders with status-aware recall`

- [ ] **6. The full demo runs end to end, checked automatically and ready to record**
  Becomes usable: A `demo_check.py` script runs all three demo cases against real Claude and reports pass/fail; the README explains setup, running, and the recording steps; server-down and missing-key states show friendly messages; a fresh database gives the clean first-use Home for recording.
  Why now: Turns the working pieces into a reliable demo and proves the three demo cases together right before final review.
  PRD ref: `prd.md > The Core Journey`, `prd.md > What We're Building`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Important Failure Modes`, `spec.md > File Structure` (`scripts/demo_check.py`, `README.md`)
  Build: `server/scripts/demo_check.py` (temporary DB; Sarah extraction, brain-dump extraction with dates, save, Sarah recall, never-saved question); `README.md`; "Can't reach Huf's server" and missing-key messages; any remaining failure-mode copy from the spec.
  Verify (mechanical): `demo_check.py` passes all cases; `pytest` passes; `npm run build` passes; with uvicorn stopped, headless screenshot shows the server-unreachable message.
  Learner check: Delete `server/huf.db`, restart, and run the whole demo story once — Sarah capture, review, save, Memories, refresh, Ask Huf, brain dump — as if recording.
  Commit: `Add demo check, README, and remaining failure states`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 3: the whole kernel works by typing (capture → save → ask). Feedback here can still shape voice, Memories, and polish. Learner: "it all works perfectly"; asked that Ask Huf get voice (already planned in slice 4).
- [ ] Visual design checkpoint — after slice 5, before slice 6: review every screen against `spec.md > Look and Feel` for a distinctive, minimal, premium consumer feel (not generic AI styling); agreed fixes recorded and done before the demo check.
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Person chooser added to slice 2 — learner asked at build planning to select the right person when several share a name; PRD and spec updated (simple chooser, no conversation).
- Slice 1 adds request-date/timezone tests and a no-invented-time check — learner asked for relative dates and timezone handling to be tested early.
- Python: reuse existing 3.12.11 instead of installing 3.13 — learner asked to use a compatible existing version; it is an Intel build under Rosetta, acceptable for the server.
- Visual design checkpoint added before slice 6 — learner wants a distinctive, premium consumer look reviewed before the demo.
- Slice 4 marked essential — learner: working mic capture is not optional polish.
- Working principle from the learner: at every checkpoint prefer a complete, reliable experience over new features; once the three demo cases work, focus on testing, visual polish, and the video.
- Claude calls use `client.beta.messages.parse` (SDK 2.3.0) — the refusal fallback is only on the beta surface; verified in slice 1 together with `effort` + Pydantic output.
- Until slice 4, the Home mic opens typing, and the nav bar is hidden until a second tab exists — so no visible button is a dead end mid-build.
- Answer prompt tuned to sound like a friend recalling ("Sarah from work told you…") rather than naming app internals ("saved", "pending") — first live answers read mechanical against the PRD's example.
- Slice 4 mechanical checks use a dev-only speech test double (`window.__hufFakeSpeech`, honored only when `import.meta.env.DEV`) injected by the verification script; it is absent from the production build. Real recognition is verified by the learner in Chrome.
- Speech keeps listening through pauses (Chrome ends sessions after silence; the hook restarts and keeps prior text) until Done; an empty Done reports "didn't hear anything" rather than sending blank text.
