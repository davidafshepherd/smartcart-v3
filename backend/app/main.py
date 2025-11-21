from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from .ml_pipeline import run_pipeline  # stub for now

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_meal(image: UploadFile = File(...)):
    items, totals = run_pipeline("dummy_path")
    return {"items": items, "totals": totals}
