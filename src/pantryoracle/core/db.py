import aiosqlite
from .config import get_settings

async def get_db():
    """Async context manager yielding aiosqlite connection."""
    settings = get_settings()
    async with aiosqlite.connect(settings.database_url) as db:
        yield db

async def init_db() -> None:
    """Create tables if they do not exist."""
    settings = get_settings()
    async with aiosqlite.connect(settings.database_url) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                aliases_json TEXT NOT NULL,
                category TEXT NOT NULL,
                shelf_sealed INTEGER,
                shelf_opened INTEGER,
                shelf_fridge INTEGER,
                shelf_freezer INTEGER,
                rancidity_signs_json TEXT NOT NULL,
                cold_safe TEXT NOT NULL,
                cold_note TEXT,
                toss_rule TEXT NOT NULL,
                sources_json TEXT NOT NULL
            )
        """)
        await db.commit()