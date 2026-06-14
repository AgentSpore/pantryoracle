import aiosqlite
import json
from ..core.db import get_db
from ..schemas.food import FoodRead

async def get_food_by_name_or_alias(name: str) -> list[FoodRead]:
    """Fuzzy search by name or alias -> list of FoodRead."""
    async for db in get_db():
        query = """
            SELECT id, name, category FROM foods
            WHERE lower(name) LIKE ? OR lower(aliases_json) LIKE ?
            LIMIT 10
        """
        like = f"%{name.lower()}%"
        async with db.execute(query, (like, like)) as cursor:
            rows = await cursor.fetchall()
            return [FoodRead(id=r[0], name=r[1], category=r[2]) for r in rows]

async def get_food_by_id(food_id: int) -> FoodRead:
    """Full verdict card for a food."""
    async for db in get_db():
        query = """
            SELECT id, name, aliases_json, category, shelf_sealed, shelf_opened,
                   shelf_fridge, shelf_freezer, rancidity_signs_json, cold_safe,
                   cold_note, toss_rule, sources_json
            FROM foods WHERE id = ?
        """
        async with db.execute(query, (food_id,)) as cursor:
            row = await cursor.fetchone()
            if row is None:
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Food not found")
            (
                id_, name, aliases_json, category, shelf_sealed, shelf_opened,
                shelf_fridge, shelf_freezer, rancidity_signs_json, cold_safe,
                cold_note, toss_rule, sources_json
            ) = row
            # For now return basic FoodRead; the API can be updated later to use a richer schema.
            return FoodRead(id=id_, name=name, category=category)

async def check_symptom(food_id: int, symptom: str) -> dict:
    """Return verdict based on symptom."""
    async for db in get_db():
        query = "SELECT rancidity_signs_json FROM foods WHERE id = ?"
        async with db.execute(query, (food_id,)) as cursor:
            row = await cursor.fetchone()
            if row is None:
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Food not found")
            rancidity_signs_json = row[0]
            signs = json.loads(rancidity_signs_json)
            symptom_lower = symptom.lower()
            matched = [sign for sign in signs if sign.lower() in symptom_lower]
            if matched:
                verdict = "likely rancid"
                explanation = f"Matched rancidity signs: {', '.join(matched)}"
            else:
                verdict = "probably fine"
                explanation = "No rancidity signs matched the symptom."
            return {
                "verdict": verdict,
                "matched_signs": matched,
                "explanation": explanation
            }