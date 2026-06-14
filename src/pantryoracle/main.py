from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api import food

app = FastAPI(title="PantryOracle", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(food.router, prefix="/api/v1")

# Mount static frontend directory at root, serving index.html
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

@app.get("/health")
def health():
    return {"status": "ok"}