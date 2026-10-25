"""Shapes shared by the API and by Claude's structured outputs."""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class DraftItem(BaseModel):
    """One thing Huf found in what you said. Not saved until you confirm it."""

    kind: Literal["memory", "reminder"]
    text: str
    person: Optional[str] = None
    due_text: Optional[str] = None
    due_date: Optional[str] = None  # YYYY-MM-DD, never a time
    recurrence: Optional[str] = None


class Extraction(BaseModel):
    """What Claude must return when sorting a transcript."""

    items: list[DraftItem]


class ExtractRequest(BaseModel):
    transcript: str = Field(min_length=1)
    today: date
    weekday: str
    timezone: str


class ExtractResponse(BaseModel):
    items: list[DraftItem]
