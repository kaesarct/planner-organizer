from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from routers import web, auth, events, tasks, users
from init_db import create_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    yield
    # Shutdown (se necessario)

# Web Server separato (solo HTML)
web_app = FastAPI(title="Scout Planner Web", version="1.0.0", debug=True, lifespan=lifespan)

# Middleware per sessioni
web_app.add_middleware(SessionMiddleware, secret_key="scout-planner-session-secret")

web_app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Web routes (HTML only)
web_app.include_router(web.router, tags=["web"])
# API routes necessarie per il frontend
web_app.include_router(auth.router, prefix="/auth", tags=["auth"])
web_app.include_router(events.router, prefix="/api/events", tags=["events"])
web_app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
web_app.include_router(users.router, prefix="/api/users", tags=["users"])

@web_app.get("/")
def web_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})