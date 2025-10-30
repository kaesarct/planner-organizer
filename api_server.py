from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, events, tasks, users, groups
from init_db import create_tables

# API Server separato (solo JSON)
api_app = FastAPI(title="Scout Planner API", version="1.0.0")

# Configura CORS per permettere chiamate dal frontend
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_app.on_event("startup")
async def startup_event():
    create_tables()

# API routes (JSON only)
api_app.include_router(auth.router, prefix="/auth", tags=["auth"])
api_app.include_router(users.router, prefix="/users", tags=["users"])
api_app.include_router(groups.router, prefix="/groups", tags=["groups"])
api_app.include_router(events.router, prefix="/events", tags=["events"])
api_app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

@api_app.get("/")
def api_root():
    return {"message": "Scout Planner API", "docs": "/docs"}