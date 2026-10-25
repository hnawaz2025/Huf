from llm import clean_item
from schemas import DraftItem

SAID = "I need to call the dentist tomorrow morning and pay rent on the first of every month"


def test_valid_date_is_kept():
    item = DraftItem(kind="reminder", text="Call the dentist", due_text="tomorrow morning", due_date="2026-10-26")
    assert clean_item(item, SAID).due_date == "2026-10-26"


def test_unparseable_date_is_dropped():
    item = DraftItem(kind="reminder", text="Call the dentist", due_date="next-ish")
    assert clean_item(item, SAID).due_date is None


def test_invented_time_phrase_is_dropped():
    item = DraftItem(kind="reminder", text="Call the dentist", due_text="tomorrow at 9:00 AM", due_date="2026-10-26")
    cleaned = clean_item(item, SAID)
    assert cleaned.due_text is None
    assert cleaned.due_date == "2026-10-26"


def test_spoken_phrase_is_kept_case_insensitively():
    item = DraftItem(kind="reminder", text="Call the dentist", due_text="Tomorrow Morning")
    assert clean_item(item, SAID).due_text == "Tomorrow Morning"


def test_memories_carry_no_due_fields():
    item = DraftItem(kind="memory", text="Sarah is moving in December", due_text="December", due_date="2026-12-01", recurrence="yearly")
    cleaned = clean_item(item, "Sarah is moving in December")
    assert (cleaned.due_text, cleaned.due_date, cleaned.recurrence) == (None, None, None)


def test_empty_text_is_removed():
    assert clean_item(DraftItem(kind="memory", text="   "), SAID) is None
