from fastapi.testclient import TestClient

import llm
from main import app
from schemas import DraftItem

client = TestClient(app)

SARAH = {
    "transcript": "Sarah from work told me she's moving to Seattle in December, and I promised to send her an article tomorrow.",
    "today": "2026-10-25",
    "weekday": "Sunday",
    "timezone": "America/New_York",
}


def test_extract_returns_drafts_without_saving(monkeypatch):
    monkeypatch.setattr(
        llm, "extract_items", lambda *a: [DraftItem(kind="memory", text="Sarah is moving", person="Sarah from work")]
    )
    res = client.post("/api/extract", json=SARAH)
    assert res.status_code == 200
    assert res.json()["items"][0]["person"] == "Sarah from work"
    assert client.get("/api/items").json() == []


def test_extract_failure_is_a_friendly_502(monkeypatch):
    def boom(*a):
        raise llm.LLMError("Couldn't reach Claude.")

    monkeypatch.setattr(llm, "extract_items", boom)
    res = client.post("/api/extract", json=SARAH)
    assert res.status_code == 502


def test_save_then_list():
    body = {
        "source_transcript": SARAH["transcript"],
        "items": [
            {"kind": "memory", "text": "Sarah from work is moving to Seattle in December", "person": "Sarah from work"},
            {"kind": "reminder", "text": "Send Sarah the article", "person": "Sarah from work", "due_date": "2026-10-26"},
        ],
    }
    saved = client.post("/api/items", json=body)
    assert saved.status_code == 200
    listed = client.get("/api/items").json()
    assert len(listed) == 2
    assert {i["id"] for i in listed} == {i["id"] for i in saved.json()}


def test_saving_nothing_is_rejected():
    assert client.post("/api/items", json={"source_transcript": "x", "items": []}).status_code == 422
    blank = {"source_transcript": "x", "items": [{"kind": "memory", "text": "  "}]}
    assert client.post("/api/items", json=blank).status_code == 422


def _save_sarah():
    body = {
        "source_transcript": "said",
        "items": [
            {"kind": "memory", "text": "Sarah from work is moving to Seattle in December", "person": "Sarah from work"},
            {"kind": "reminder", "text": "Send Sarah the article", "person": "Sarah from work", "due_date": "2026-10-26"},
        ],
    }
    memory, reminder = client.post("/api/items", json=body).json()
    return memory, reminder


def test_edit_text_survives_reload():
    memory, _ = _save_sarah()
    res = client.patch(f"/api/items/{memory['id']}", json={"text": "Sarah from work is moving to Portland in December"})
    assert res.status_code == 200
    reloaded = {i["id"]: i for i in client.get("/api/items").json()}
    assert reloaded[memory["id"]]["text"].endswith("Portland in December")
    assert reloaded[memory["id"]]["updated_at"] >= memory["updated_at"]


def test_toggle_reminder_status():
    _, reminder = _save_sarah()
    done = client.patch(f"/api/items/{reminder['id']}", json={"status": "completed"}).json()
    assert done["status"] == "completed"
    back = client.patch(f"/api/items/{reminder['id']}", json={"status": "pending"}).json()
    assert back["status"] == "pending"


def test_switching_kind_keeps_item_consistent():
    _, reminder = _save_sarah()
    as_memory = client.patch(f"/api/items/{reminder['id']}", json={"kind": "memory"}).json()
    assert (as_memory["due_date"], as_memory["status"]) == (None, None)
    as_reminder = client.patch(f"/api/items/{reminder['id']}", json={"kind": "reminder"}).json()
    assert as_reminder["status"] == "pending"


def test_bad_edits_are_rejected():
    memory, _ = _save_sarah()
    assert client.patch(f"/api/items/{memory['id']}", json={"text": "  "}).status_code == 422
    assert client.patch(f"/api/items/{memory['id']}", json={"due_date": "next-ish"}).status_code == 422
    assert client.patch("/api/items/nope", json={"text": "x"}).status_code == 404


def test_delete():
    memory, reminder = _save_sarah()
    assert client.delete(f"/api/items/{memory['id']}").status_code == 204
    assert [i["id"] for i in client.get("/api/items").json()] == [reminder["id"]]
    assert client.delete(f"/api/items/{memory['id']}").status_code == 404
