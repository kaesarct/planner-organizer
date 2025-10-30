#!/usr/bin/env python3

# Test per verificare le route registrate
from web_server import web_app

print("Route registrate nel web server:")
for route in web_app.routes:
    if hasattr(route, 'path'):
        print(f"- {route.methods} {route.path}")

print("\nTesting /admin route...")
try:
    from routers.web import router
    print("Router web importato correttamente")
    print("Route nel router:")
    for route in router.routes:
        if hasattr(route, 'path'):
            print(f"- {route.methods} {route.path}")
except Exception as e:
    print(f"Errore: {e}")