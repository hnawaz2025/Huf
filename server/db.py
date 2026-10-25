"""Huf's storage: one SQLite file, one table. Plain SQL, no ORM."""

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

from schemas import DraftItem, Item

DEFAULT_PATH = Path(__file__).parent / "huf.db"

COLUMNS = (
    "id, kind, text, person, due_text, due_date, recurrence, status, source_transcript, created_at, updated_at"
)


def db_path() -> Path:
    return Path(os.getenv("HUF_DB", DEFAULT_PATH))


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                kind TEXT NOT NULL CHECK (kind IN ('memory', 'reminder')),
                text TEXT NOT NULL,
                person TEXT,
                due_text TEXT,
                due_date TEXT,
                recurrence TEXT,
                status TEXT CHECK (status IN ('pending', 'completed')),
                source_transcript TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _row_to_item(row: sqlite3.Row) -> Item:
    return Item(**dict(row))


def list_items() -> list[Item]:
    with connect() as conn:
        rows = conn.execute(f"SELECT {COLUMNS} FROM items ORDER BY created_at DESC, rowid DESC").fetchall()
    return [_row_to_item(r) for r in rows]


def get_items_by_ids(ids: Iterable[str]) -> list[Item]:
    ids = list(ids)
    if not ids:
        return []
    marks = ",".join("?" for _ in ids)
    with connect() as conn:
        rows = conn.execute(f"SELECT {COLUMNS} FROM items WHERE id IN ({marks})", ids).fetchall()
    by_id = {r["id"]: _row_to_item(r) for r in rows}
    return [by_id[i] for i in ids if i in by_id]


def insert_items(drafts: list[DraftItem], source_transcript: str) -> list[Item]:
    now = _now()
    saved: list[Item] = []
    with connect() as conn:
        for d in drafts:
            item = Item(
                **d.model_dump(),
                id=str(uuid.uuid4()),
                status="pending" if d.kind == "reminder" else None,
                source_transcript=source_transcript,
                created_at=now,
                updated_at=now,
            )
            conn.execute(
                f"INSERT INTO items ({COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (
                    item.id, item.kind, item.text, item.person, item.due_text, item.due_date,
                    item.recurrence, item.status, item.source_transcript, item.created_at, item.updated_at,
                ),
            )
            saved.append(item)
    return saved


def get_item(item_id: str) -> Optional[Item]:
    found = get_items_by_ids([item_id])
    return found[0] if found else None
