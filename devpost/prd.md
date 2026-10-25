---
doc: prd
status: approved
---

# Huf — Product Requirements

A calm, mobile-first voice memory assistant for a busy commuter: say a thought once, review what Huf understood, and ask about it later.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

## The Core Journey

1. **Open Huf.** Home shows the huf. logo, "What's on your mind?", and one large microphone button with "Tap to talk." Within one second it's obvious what to do. (`scope.md > Inspiration & Identity`)
2. **Tap the mic.** Huf enters a listening state: the mic expands slightly with a soft lavender pulse/waveform. Your words appear as live captions while you speak.
3. **Say it naturally:** "Sarah from work told me she's moving to Seattle in December, and I promised to send her an article tomorrow."
4. **Tap Done.** Listening stops; Huf shows "Making sense of your thoughts…"
5. **Review.** The original transcription sits at the top; below it, a **memory card** (Sarah from work is moving to Seattle in December · Sarah from work) and a **reminder card** (Send Sarah the article · due tomorrow · Sarah from work). Edit or remove either card.
6. **Save both.** Huf confirms the save and returns to Home, where the reminder appears under **Coming up** and the memory under **Recently remembered**.
7. **Find it in Memories.** Both items are listed, visibly distinguished, with Sarah from work shown on each.
8. **Refresh the app.** Everything is still there.
9. **Ask Huf** (voice or typing): "What did Sarah from work tell me, and do I owe her anything?" Huf replies: "Sarah from work told you she's moving to Seattle in December. You also promised to send her an article tomorrow." The memory and reminder cards it used appear beneath the answer.
10. **Second beat:** on Home, say "I need to return my Amazon package by Friday, call the dentist tomorrow morning, and pay rent on the first of every month" → three separate reminder cards with the right dates (rent labeled monthly) → save. (`scope.md > What "Working" Looks Like`)

Success: steps 1–9 work with real speech and real saved data, and the Ask Huf answer is built from what was saved, not hardcoded.

## Screens and Layout

Bottom navigation with three tabs: **Home**, **Memories**, **Ask Huf**. No settings or profile icon.

- **Home** — top: small huf. logo on the left. Then greeting "What's on your mind?" Center: large mic button, "Tap to talk," and a small "Type instead" option. Below: **Coming up** (next 2–3 pending reminders: task + when due) and **Recently remembered** (1–2 latest memories).
- **Listening** (state of Home) — expanded mic with listening animation, live transcription, one clear **Done** button. Nothing else.
- **Processing** (state of Home) — "Making sense of your thoughts…"
- **Review** — original transcription at top, extracted cards below, one primary save button at the bottom ("Save both" for two items; the label reflects the count).
- **Memories** — everything Huf has saved: memories and reminders, distinguishable at a glance, with associated person shown. Tap an item to view details, edit, delete, or (for reminders) toggle Pending/Completed.
- **Ask Huf** — simple chat: your question, Huf's answer, supporting cards beneath. Ask by voice or typing.

## Look and Feel

Direction from the learner — `4-spec` translates this into styling without asking again:

- **Feel:** editorial, minimal, warm, quietly premium — "closer to a beautifully designed native productivity app than an AI chatbot." A tiny companion, not a dashboard.
- **Typography:** clean contemporary sans-serif such as **Inter**, with carefully chosen weights and spacing. No decorative fonts, no serif headings. Hierarchy comes from type, alignment, whitespace, and subtle contrast.
- **Color:** restrained palette — warm ivory background, deep indigo text, muted lavender accents.
- **Surfaces:** mostly flat, minimal shadows, subtle corner rounding (not pill-shaped everything), consistent spacing.
- **Motion:** small, purposeful animations. The **microphone interaction is the visual signature** — the one place with distinctive motion.
- **Item types:** memory and reminder cards look slightly different — e.g., a small bookmark icon for memories, a clock icon for reminders.
- **Avoid:** generic purple gradients, oversized rounded cards, excessive shadows, glowing AI icons, predictable SaaS dashboard layouts.

## Features and Behavior

### Capture by Voice
(`scope.md > The POC Boundary`)
- As a commuter, I want to tap once and talk naturally so I can capture a thought without stopping what I'm doing.
  - [ ] Tapping the mic visibly enters the listening state (mic expands, lavender pulse/waveform).
  - [ ] Spoken words appear as live captions while speaking.
  - [ ] Tapping **Done** stops listening and shows "Making sense of your thoughts…"
  - [ ] The transcript shown on Review matches what was actually said.

### Typed Capture
- As someone who can't speak out loud right now, I want to type instead.
  - [ ] "Type instead" on Home opens a text input; submitting it goes through the same processing and Review as voice.

### Sorting Thoughts into Memories and Reminders
(`scope.md > The Unique Kernel`)
- As a commuter, I want one sentence to become the right separate items so I never have to categorize before speaking.
  - [ ] The Sarah sentence produces exactly one memory and one reminder.
  - [ ] Each item is labeled memory or reminder and visually distinct.
  - [ ] A person mentioned is attached to the items exactly as said ("Sarah from work"); if no person is mentioned, no person is shown.
  - [ ] The Amazon/dentist/rent sentence produces three separate reminders.
  - [ ] Relative dates resolve from the device's current date (tomorrow → the actual next day; Friday → the coming Friday; "first of every month" → labeled monthly, recurring).
  - [ ] Huf never invents a specific time for vague phrases ("tomorrow morning" stays "tomorrow morning", not "9:00 AM").

### Review Before Saving
- As someone who knows AI isn't always right, I want to check and fix what Huf understood before anything is saved.
  - [ ] Review shows the original transcription above the cards.
  - [ ] Each card's text, type, person, and date can be edited.
  - [ ] Any card can be removed.
  - [ ] If a card's person matches more than one saved person by name, the card offers a chooser (each saved person + keep as spoken); nothing is picked automatically.
  - [ ] Nothing is saved until the save button is tapped.
  - [ ] After saving, Huf confirms and returns to Home, showing the new items under Coming up / Recently remembered.

### Home at a Glance
- [ ] Coming up shows at most the next 2–3 **pending** reminders, each with task and due date.
- [ ] Recently remembered shows the 1–2 most recent memories.
- [ ] Sections with nothing to show are hidden entirely.

### Memories
(`scope.md > The POC Boundary` — revised: learner chose basic browsing as **now**; see Product Decisions)
- As a user, I want one place to see everything Huf has remembered.
  - [ ] Lists all saved memories and reminders, each visibly typed and showing its person when present.
  - [ ] Tapping an item opens its details, where it can be edited or deleted.
  - [ ] Reminders can be toggled between **Pending** and **Completed**; the status is visible.
  - [ ] Edits, deletions, and status changes survive a refresh.

### Ask Huf
(`scope.md > What "Working" Looks Like`)
- As a user, I want to ask a plain-language question and get an answer from what I actually told Huf.
  - [ ] Questions can be spoken or typed.
  - [ ] The Sarah question returns an answer mentioning both the Seattle move in December and the pending article reminder.
  - [ ] The memory and reminder cards used appear beneath the answer.
  - [ ] Completed reminders are described as completed, not as something still owed ("You already completed the reminder to send Sarah the article.").
  - [ ] A question about something never saved returns "I don't have anything saved about that yet." — with no invented details.
  - [ ] The answer is generated from saved data, not hardcoded: changing a saved item (e.g., editing "Seattle" to "Portland") changes the answer.

## States and Boundaries

- **First use** — Home shows only logo, greeting, mic, and "Type instead." No empty Coming up or Recently remembered sections.
- **Empty Memories** — a short, calm line saying nothing's saved yet and pointing to Home. *(Assumption — wording to be refined.)*
- **Microphone permission denied** — clear explanation, with options to try again or type instead.
- **Transcription fails / Huf can't hear anything** — clear explanation, try again or type instead.
- **Huf finds nothing to save** — Review explains nothing was found, with try again or type instead. *(Assumption.)*
- **Processing fails** — clear message; the transcription is kept so you can retry without re-speaking. *(Assumption.)*
- **Ambiguous person** — Huf keeps the name exactly as spoken ("Sarah") and never silently attaches it to a different Sarah. If the spoken name matches more than one person already saved (e.g., "Sarah from work" and "Sarah Chen"), the Review card shows a simple chooser — each saved person plus "Keep as Sarah" — and you pick. No back-and-forth conversation. *(Revised at build planning by learner.)*
- **Persistence** — saved memories, reminders, and reminder status survive refresh and closing the app, on this one device. Ask Huf chat history does not need to persist. *(Assumption.)*
- **Nothing found for a question** — the honest "I don't have anything saved about that yet."

## Product Decisions

- **Memories tab works in this version** — the learner wants the Sarah story to work across the whole app (capture → confirm → find in Memories → ask). Scope had "browsing and managing a full history" in Later; this pulls *basic* browsing, detail, edit, delete, and status into **now**. No folders, organization, or filters.
- **No settings/profile icon** — "I'd rather leave it out of the MVP than have a button that doesn't do anything."
- **Every visible button has a purpose and actually works.** — a rule for the whole build.
- **No "which Sarah?" conversation, but a simple chooser on Review** — not the core innovation; preserve the context as given and don't assume. Added at build planning: "If multiple people share a name, let me select the correct person during review."
- **Reminders have two states, Pending and Completed, toggleable** — "important for Huf's accuracy, not just task management"; Ask Huf's answers reflect current status.
- **Ask Huf supports voice and text** — whichever is convenient.
- **Accurate retrieval over a sophisticated chatbot.**
- **Inter-style sans-serif, flat and restrained** — to avoid looking AI-generated.

## What We're Building

- Home with mic, live-caption listening state, Done, processing, and typed fallback.
- Extraction of multiple memories/reminders from one input, with people and dates (recurrence labeled).
- Review with edit, remove, and explicit save.
- Home sections: Coming up and Recently remembered.
- Memories: browse, detail, edit, delete, Pending/Completed toggle.
- Ask Huf: voice or typed question, grounded answer, supporting cards, honest "nothing saved" response, status-aware.
- Persistence across refresh on one device.
- The error and empty states above.
- Both demo beats working end to end with real speech.

## Deferred From the POC

- **Search in Memories** — Ask Huf is already how you find things; a separate search box adds a second retrieval path without proving the kernel. *(Confirmed by learner at review.)*
- **Clarifying-question conversations** — scope Later; editing on Review covers mistakes.
- **Settings screen** (e.g., clear all data) — add only if a genuine need appears.
- **Notifications at due time** — scope Later.
- **Persistent Ask Huf chat history** — not needed to prove recall.

## Possible Later Enhancements

- Broad questions like "What am I forgetting this week?" or "What recommendations have people given me?" tuned and tested.
- Discipline features: follow-through, recurring-pattern spotting, gentle nudges.
- Person pages that gather everything about one person.

## Non-Goals

- **Contacts integration** — people come from what you say.
- **Calendar syncing** — complexity that doesn't prove context memory.
- **Recurring notifications** — recurrence is labeled, not scheduled.
- **Wake word / always-on listening** — tap-to-talk only.
- **Accounts and multi-device sync** — one person, one device.
- **Folders, tags, advanced filters** — "I don't think we need complicated organization."
- **Hardcoded demo responses** — every answer comes from saved data.

## Open Questions

- ~~Search in Memories?~~ Resolved: deferred; Ask Huf is the retrieval path.
- ~~Ambiguous "Sarah"?~~ Resolved: keep as spoken, editable, never auto-matched.
- How Ask Huf's voice input and Home's mic share the same listening interaction — a detail `4-spec` can settle.
