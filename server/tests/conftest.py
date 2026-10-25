import pytest

import db


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Every test gets its own empty database file."""
    monkeypatch.setenv("HUF_DB", str(tmp_path / "test.db"))
    db.init_db()
    yield
