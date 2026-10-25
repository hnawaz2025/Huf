---
doc: scope
status: approved
---

# Huf

A voice-first personal memory assistant: say a thought once, and Huf sorts it into memories and reminders you can ask about later.
*Say it once. Huf remembers.*

## The Unique Kernel
Huf remembers **context**, not just commands. One natural sentence — "Sarah from work told me she's moving to Seattle in December, and I promised to send her an article tomorrow" — becomes a **memory** and a **commitment**, both tied to Sarah. Later, one question — "What did Sarah tell me, and do I owe her anything?" — brings both back in a single answer, with the saved items shown as proof.

You never decide up front whether something is a task, a note, or a reminder. "That's not how our brains work. Thoughts just happen."

## Who It's For
Someone like the learner: commuting to work every day with "a bazzillion things" on their mind, who forgets promises — like calling their aunt — and feels guilty about it. Today they either forget, or stop to open a reminders app and type three separate tasks. Siri needs command phrasing and doesn't do a good job; Alexa isn't available on the go.

## The Core Loop
Open Huf → tap one big mic → talk naturally, like to a friend → see what Huf heard and what it understood (memory cards and reminder cards) → fix anything → save → move on.
Later: ask Huf a question in plain language → get an answer drawn only from what you actually told it, with the source items shown.
They come back because every capture makes the recall more valuable: "a searchable memory of the little details of my everyday life."

## Inspiration & Identity
- The ease of Siri/Alexa, but portable and actually reliable — no "Hey Siri, remind me…" three times.
- Calm, minimal, lightweight — "not like another complicated productivity dashboard." One big microphone button.
- Transparent: show what Huf heard, what it understood, and where it saved it. Everything editable, "because AI isn't always right."
- Brief's suggested palette: soft lavender, warm ivory, deep indigo; mobile-first; premium and warm. (To be confirmed in `3-prd`.)

## Why This Matters to the Learner
They'd use it every day on their commute. "Juggling with multiple things every day i forget on important stuff which makes me guilty." The feeling they want: **"I said it once, and I can trust that I won't lose it."**

## What "Working" Looks Like
In the learner's words: open the app, tap the mic, speak naturally. Huf transcribes what was actually said, understands it, and shows what it extracted — for the Sarah sentence, a memory card and a reminder card, both associated with Sarah. Review, correct, save. **Refresh the app**, come back, ask what Sarah told me and what I owe her — Huf retrieves what was actually saved and answers accurately. "It shouldn't be a hardcoded response that only works for our demo."

Second beat: say "return my Amazon package by Friday, call the dentist tomorrow morning, and pay rent on the first of every month" and watch Huf split it into three reminders with the right dates.

**The "oh, that's cool" beat:** the recall answer about Sarah, with the original memory and reminder cards shown beneath it.

## The POC Boundary
- Tap-to-talk with real transcription of real speech; typed input as fallback.
- One input → multiple extracted items, each labeled **memory** or **reminder**, linked to a person when there is one, with dates resolved from the device's current date (and recurrence *labeled*, e.g. "every month").
- Review before saving: edit, delete, confirm. Nothing saved silently.
- Saved items persist across refresh.
- Ask Huf: plain-language question → answer grounded only in saved items, with those items shown; honest "I don't have that" when nothing matches.
- Both demo beats (Sarah story first in priority; three-reminder brain dump second).
- Real functionality throughout — no hardcoded demo answers.

## Later
- Huf asking clarifying questions when something is ambiguous.
- Browsing and managing a full history.
- Broad questions ("What am I forgetting this week?", "What recommendations have people given me?") — may partly work, but not built or tuned for.
- Actual reminder notifications at the due time.
- Discipline: helping follow through on commitments, spotting recurring patterns, gently nudging about things put off. "I don't want it to become a habit tracker or productivity coach right now."

## Explicitly Cut
- **Contacts integration** — people are recognized from what you say; no address book needed to prove the kernel.
- **Calendar syncing** — reminders live in Huf; syncing adds auth and complexity without proving context memory.
- **Recurring notifications** — recurrence is labeled, not scheduled; scheduling is a separate problem.
- **"Hey Huf" wake word / always-on listening** — tap-to-talk is enough and avoids background-listening complexity and privacy concerns.
- **Accounts and multi-device sync** — one device, one person, local data proves the loop.
