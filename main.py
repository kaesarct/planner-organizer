import threading
import uvicorn
import debugpy
from api_server import api_app
from web_server import web_app

# Configura debugpy per debug remoto
debugpy.listen(("0.0.0.0", 5678))
print("🐛 Debugger in ascolto su porta 5678")

def run_api_server():
    """Avvia il server API su porta 8001"""
    uvicorn.run(api_app, host="0.0.0.0", port=8001)

def run_web_server():
    """Avvia il server Web su porta 8000"""
    uvicorn.run(web_app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    print("🚀 Scout Planner avviato!")
    print("📱 Web: http://localhost:8000")
    print("🐛 Debug: localhost:5678")
    
    # Avvia solo web server (architettura unificata)
    run_web_server()