"""Huf's server: the only place that holds the API key and talks to Claude."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

import llm
from schemas import ExtractRequest, ExtractResponse

load_dotenv(Path(__file__).parent / ".env")
log = logging.getLogger("huf")

app = FastAPI(title="Huf")


@app.on_event("startup")
def warn_missing_key() -> None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        log.warning("ANTHROPIC_API_KEY is not set — add it to server/.env")


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
