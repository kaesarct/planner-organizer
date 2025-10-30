from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from routers import web

# Web Server separato (solo HTML)
web_app = FastAPI(title="Scout Planner Web", version="1.0.0", debug=True)

web_app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Web routes (HTML only)
web_app.include_router(web.router, tags=["web"])

@web_app.get("/")
def web_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})