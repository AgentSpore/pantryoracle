from fastapi import APIRouter, Query, HTTPException, Path
from ..schemas.food import FoodRead, FoodList
from typing import List, Optional
import json

router = APIRouter()

# In-memory placeholder; will be replaced by service in G4
_FAKE_DB: List[dict] = []

@router.get("/foods", response_model=FoodList)
async def list_foods(q: Optional[str] = Query(None, description="Search query")):
    """Fuzzy search by name/alias -> list of {id, name, category}."""
    if not q:
        # Return empty list for now; service will populate
        return FoodList(items=[], count=0)
    # Simple case-insensitive match on name
    matches = [f for f in _FAKE_DB if q.lower() in f.get("name", "").lower()]
    # Return only id, name, category
    result = [FoodRead(id=f["id"], name=f["name"], category=f.get("category")) for f in matches]
    return FoodList(items=result, count=len(result))

@router.get("/foods/{food_id}", response_model=FoodRead)
async def get_food(food_id: int = Path(..., gt=0)):
    """Full verdict card for a food."""
    # Find in fake db
    for f in _FAKE_DB:
        if f["id"] == food_id:
            return FoodRead(**f)
    raise HTTPException(status_code=404, detail="Food not found")

@router.post("/foods/{food_id}/symptom")
async def check_symptom(
    food_id: int = Path(..., gt=0),
    symptom: str = Query(..., description="Symptom description")
):
    """Return verdict based on symptom."""
    # Placeholder: will call service in G4
    # For now return a static response
    return {
        "verdict": "probably fine",
        "matched_signs": [],
        "explanation": "Symptom checking not yet implemented."
    }