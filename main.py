from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .forecast_model import analyze_sales_dataset


class ForecastRequest(BaseModel):
    fileName: str | None = None
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)


app = FastAPI(title="AIRE Forecast API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/forecast/analyze")
def analyze_forecast(request: ForecastRequest):
    return analyze_sales_dataset(request.model_dump())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
