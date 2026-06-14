from pydantic import BaseModel, Field
from typing import List, Optional

class FoodBase(BaseModel):
    name: str = Field(..., example="walnuts")
    category: Optional[str] = Field(None, example="nuts_and_seeds")

class FoodCreate(FoodBase):
    aliases_json: str = Field(..., example='["walnut"]')
    shelf_sealed: int = Field(..., example=12)
    shelf_opened: int = Field(..., example=3)
    shelf_fridge: Optional[int] = Field(None, example=6)
    shelf_freezer: Optional[int] = Field(None, example=12)
    rancidity_signs_json: str = Field(..., example='["bitter", "paint-like"]')
    cold_safe: str = Field(..., example="yes")
    cold_note: Optional[str] = Field(None, example="")
    toss_rule: str = Field(..., example="Discard if bitter or paint-like smell.")
    sources_json: str = Field(..., example='["USDA"]')

class FoodRead(FoodBase):
    id: int
    category: Optional[str] = None

    class Config:
        from_attributes = True

class FoodList(BaseModel):
    items: List[FoodRead]
    count: int

class FoodAnalyticsResponse(BaseModel):
    total_foods: int
    categories: dict[str, int]