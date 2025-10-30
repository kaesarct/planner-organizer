import threading
import uvicorn
from api_server import api_app
from web_server import web_app

def run_api_server():
    """Avvia il server API su porta 8001"""
    uvicorn.run(api_app, host="0.0.0.0", port=8001)

def run_web_server():
    """Avvia il server Web su porta 8000"""
    uvicorn.run(web_app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    # Avvia API server in un thread separato
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    api_thread.start()
    
    print("🚀 Scout Planner avviato!")
    print("📱 Web: http://localhost:8000")
    print("🔌 API: http://localhost:8001")
    print("📚 Docs: http://localhost:8001/docs")
    
    # Avvia Web server nel thread principale
    run_web_server()