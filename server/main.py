"""Huf's server: the only place that holds the API key and talks to Claude."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

import db
import llm
from schemas import ExtractRequest, ExtractResponse, Item, SaveRequest

load_dotenv(Path(__file__).parent / ".env")
log = logging.getLogger("huf")

@asynccontextmanager
async def lifespan(_: FastAPI):
    db.init_db()
    if not os.getenv("ANTHROPIC_API_KEY"):
        log.warning("ANTHROPIC_API_KEY is not set — add it to server/.env")
    yield


app = FastAPI(title="Huf", lifespan=lifespan)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "has_key": bool(os.getenv("ANTHROPIC_API_KEY"))}


@app.post("/api/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest) -> ExtractResponse:
    try:
        items = llm.extract_items(req.transcript, req.today, req.weekday, req.timezone)
    except llm.LLMError as e:
        log.warning("extract failed: %s", e)  # never log what the user said
        raise HTTPException(status_code=502, detail=str(e))
    return ExtractResponse(items=items)


@app.get("/api/items", response_model=list[Item])
def list_items() -> list[Item]:
    return db.list_items()


@app.post("/api/items", response_model=list[Item])
def save_items(req: SaveRequest) -> list[Item]:
    drafts = [d for d in req.items if d.text.strip()]
    if not drafts:
        raise HTTPException(status_code=422, detail="Nothing to save.")
    return db.insert_items(drafts, req.source_transcript)
