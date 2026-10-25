"""Run Huf's three demo cases end to end against real Claude, on a throwaway database.

    cd server && .venv/bin/python scripts/demo_check.py

Uses your ANTHROPIC_API_KEY from server/.env (a few cents per run). Never touches huf.db.
"""

import os
import sys
import tempfile
from datetime import date, timedelta
from pathlib import Path

SERVER = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER))
os.environ["HUF_DB"] = str(Path(tempfile.mkdtemp()) / "demo_check.db")

from dotenv import load_dotenv  # noqa: E402

load_dotenv(SERVER / ".env")

from fastapi.testclient import TestClient  # noqa: E402

from main import NOTHING_SAVED, app  # noqa: E402

TODAY = date.today()
CONTEXT = {"today": TODAY.isoformat(), "weekday": TODAY.strftime("%A"), "timezone": "America/New_York"}
BRAIN_DUMP = (
    "I need to return my Amazon package by Friday, call the dentist tomorrow morning, "
    "and pay rent on the first of every month."
)
SARAH = (
    "Sarah from work told me she's moving to Seattle in December, "
    "and I promised to send her an article tomorrow."
)
SARAH_QUESTION = "What did Sarah from work tell me, and do I owe her anything?"

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> bool:
    results.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail and not ok else ""))
    return ok


def next_weekday(d: date, weekday: int) -> date:
    days = (weekday - d.weekday()) % 7 or 7
    return d + timedelta(days=days)


def first_of_next_month(d: date) -> date:
    return date(d.year + (d.month == 12), d.month % 12 + 1, 1)


def extract(client: TestClient, text: str) -> list[dict]:
    res = client.post("/api/extract", json={"transcript": text, **CONTEXT})
    assert res.status_code == 200, res.text
    return res.json()["items"]


def ask(client: TestClient, question: str) -> dict:
    res = client.post("/api/ask", json={"question": question, **CONTEXT})
    assert res.status_code == 200, res.text
    return res.json()


def main() -> int:
    with TestClient(app) as client:
        print("\nCase 1 — The Brain Dump")
        items = extract(client, BRAIN_DUMP)
        reminders = [i for i in items if i["kind"] == "reminder"]
        check("three separate reminders", len(items) == 3 and len(reminders) == 3, f"got {items}")
        by_word = {w: next((i for i in items if w in i["text"].lower()), None) for w in ("amazon", "dentist", "rent")}
        amazon, dentist, rent = by_word["amazon"], by_word["dentist"], by_word["rent"]
        friday = next_weekday(TODAY, 4)  # the next Friday after today
        check("Amazon due on the coming Friday", bool(amazon) and amazon["due_date"] == friday.isoformat(), f"{amazon}")
        check("dentist due tomorrow", bool(dentist) and dentist["due_date"] == (TODAY + timedelta(days=1)).isoformat(), f"{dentist}")
        check("no invented time for 'morning'", bool(dentist) and not any(ch.isdigit() for ch in (dentist["due_text"] or "")), f"{dentist}")
        check("rent labeled monthly", bool(rent) and (rent["recurrence"] or "").lower() == "monthly", f"{rent}")
        next_first = TODAY if TODAY.day == 1 else first_of_next_month(TODAY)
        check("rent's next date is the 1st", bool(rent) and rent["due_date"] in {next_first.isoformat(), first_of_next_month(TODAY).isoformat()}, f"{rent}")
        saved = client.post("/api/items", json={"items": items, "source_transcript": BRAIN_DUMP})
        check("brain dump saves", saved.status_code == 200 and len(saved.json()) == 3)

        print("\nCase 2 — The Casual Memory")
        items = extract(client, SARAH)
        memories = [i for i in items if i["kind"] == "memory"]
        reminders = [i for i in items if i["kind"] == "reminder"]
        check("one memory + one reminder", len(memories) == 1 and len(reminders) == 1, f"got {items}")
        check("memory is the Seattle move", bool(memories) and "seattle" in memories[0]["text"].lower())
        check("both tied to Sarah from work", all((i["person"] or "").lower() == "sarah from work" for i in items), f"{[i['person'] for i in items]}")
        check("article due tomorrow", bool(reminders) and reminders[0]["due_date"] == (TODAY + timedelta(days=1)).isoformat(), f"{reminders}")
        saved = client.post("/api/items", json={"items": items, "source_transcript": SARAH}).json()
        sarah_ids = {i["id"] for i in saved}
        article = next(i for i in saved if i["kind"] == "reminder")

        print("\nCase 3 — Intelligent Recall")
        res = ask(client, SARAH_QUESTION)
        answer = res["answer"].lower()
        check("mentions Seattle in December", "seattle" in answer and "december" in answer, res["answer"])
        check("mentions the article", "article" in answer, res["answer"])
        check("shows exactly Sarah's two items", {i["id"] for i in res["items"]} == sarah_ids, f"{[i['text'] for i in res['items']]}")
        res = ask(client, "What did my landlord say about the parking spot?")
        check("honest when nothing matches", res == {"answer": NOTHING_SAVED, "items": []}, str(res))

        client.patch(f"/api/items/{article['id']}", json={"status": "completed"})
        res = ask(client, SARAH_QUESTION)
        answer = res["answer"].lower()
        check(
            "completed reminder isn't described as owed",
            ("already" in answer or "completed" in answer or "sent" in answer) and "still owe" not in answer,
            res["answer"],
        )

        memory = next(i for i in saved if i["kind"] == "memory")
        client.patch(f"/api/items/{memory['id']}", json={"text": "Sarah from work is moving to Portland in December"})
        res = ask(client, "Where is Sarah from work moving?")
        check("answer follows edited data (not hardcoded)", "portland" in res["answer"].lower() and "seattle" not in res["answer"].lower(), res["answer"])

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
