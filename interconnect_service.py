"""
Aether Interconnect Service — standalone FastAPI app (port 8002).
Mounts the interconnect router and serves all cross-module endpoints.

Run:
    venv\\Scripts\\activate && uvicorn interconnect_service:app --reload --port 8002
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.interconnect import router

app = FastAPI(
    title="Aether Interconnect Service",
    description="Cross-module coordination layer for the Aether Ecosystem",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
