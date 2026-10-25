import db
from schemas import DraftItem

MEMORY = DraftItem(kind="memory", text="Sarah from work is moving to Seattle in December", person="Sarah from work")
REMINDER = DraftItem(
    kind="reminder", text="Send Sarah the article", person="Sarah from work", due_text="tomorrow", due_date="2026-10-26"
)


def test_starts_empty():
    assert db.list_items() == []


def test_save_and_reload_round_trip():
    saved = db.insert_items([MEMORY, REMINDER], "Sarah from work told me…")
    assert {i.kind for i in saved} == {"memory", "reminder"}
    reloaded = {i.id: i for i in db.list_items()}
    assert set(reloaded) == {i.id for i in saved}
    reminder = next(i for i in reloaded.values() if i.kind == "reminder")
    assert reminder.status == "pending"
    assert reminder.due_date == "2026-10-26"
    assert reminder.source_transcript == "Sarah from work told me…"


def test_memories_have_no_status():
    [memory] = db.insert_items([MEMORY], "said")
    assert memory.status is None


def test_get_items_by_ids_skips_unknown_ids():
    [memory] = db.insert_items([MEMORY], "said")
    assert [i.id for i in db.get_items_by_ids([memory.id, "made-up-id"])] == [memory.id]


def test_data_survives_a_new_connection():
    db.insert_items([MEMORY], "said")
    # every call opens a fresh connection, like a restarted server would
    assert len(db.list_items()) == 1
