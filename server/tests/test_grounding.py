"""The server, not Claude, decides what Huf shows. Claude is stubbed here."""

from fastapi.testclient import TestClient

import db
import llm
from main import NOTHING_SAVED, app
from schemas import Answer, DraftItem

client = TestClient(app)
QUESTION = {"question": "What did Sarah tell me?", "today": "2026-10-25", "weekday": "Sunday", "timezone": "UTC"}


def save_sarah():
    return db.insert_items(
        [
            DraftItem(kind="memory", text="Sarah from work is moving to Seattle in December", person="Sarah from work"),
            DraftItem(kind="reminder", text="Send Sarah the article", person="Sarah from work", due_date="2026-10-26"),
        ],
        "said",
    )


def stub(monkeypatch, answer: Answer):
    calls = []

    def fake(*args):
        calls.append(args)
        return answer

    monkeypatch.setattr(llm, "answer_question", fake)
    return calls


def test_nothing_saved_skips_claude(monkeypatch):
    calls = stub(monkeypatch, Answer(found=True, answer="made up", used_item_ids=["x"]))
    res = client.post("/api/ask", json=QUESTION).json()
    assert res == {"answer": NOTHING_SAVED, "items": []}
    assert calls == []


def test_answer_comes_with_real_cited_items(monkeypatch):
    memory, reminder = save_sarah()
    stub(monkeypatch, Answer(found=True, answer="She's moving to Seattle.", used_item_ids=[memory.id, reminder.id]))
    res = client.post("/api/ask", json=QUESTION).json()
    assert res["answer"] == "She's moving to Seattle."
    assert [i["id"] for i in res["items"]] == [memory.id, reminder.id]


def test_invented_ids_are_dropped(monkeypatch):
    memory, _ = save_sarah()
    stub(monkeypatch, Answer(found=True, answer="She's moving.", used_item_ids=["invented-1", memory.id, memory.id]))
    res = client.post("/api/ask", json=QUESTION).json()
    assert [i["id"] for i in res["items"]] == [memory.id]


def test_only_invented_ids_means_nothing_found(monkeypatch):
    save_sarah()
    stub(monkeypatch, Answer(found=True, answer="Sarah loves sushi.", used_item_ids=["invented-1"]))
    assert client.post("/api/ask", json=QUESTION).json() == {"answer": NOTHING_SAVED, "items": []}


def test_not_found_gives_the_honest_sentence(monkeypatch):
    save_sarah()
    stub(monkeypatch, Answer(found=False, answer="", used_item_ids=[]))
    assert client.post("/api/ask", json=QUESTION).json() == {"answer": NOTHING_SAVED, "items": []}


def test_claude_failure_is_a_502(monkeypatch):
    save_sarah()

    def boom(*a):
        raise llm.LLMError("Couldn't reach Claude.")

    monkeypatch.setattr(llm, "answer_question", boom)
    assert client.post("/api/ask", json=QUESTION).status_code == 502
