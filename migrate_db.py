from database import db
from models.event import Event
from models.permission import Permission

def migrate():
    """Aggiunge nuove colonne al database"""
    db.connect()
    
    # Aggiungi colonne coordinate a Event se non esistono
    try:
        db.execute_sql('ALTER TABLE event ADD COLUMN location_lat REAL')
        print("✅ Aggiunta colonna location_lat")
    except Exception as e:
        print(f"⚠️ location_lat già esistente o errore: {e}")
    
    try:
        db.execute_sql('ALTER TABLE event ADD COLUMN location_lng REAL')
        print("✅ Aggiunta colonna location_lng")
    except Exception as e:
        print(f"⚠️ location_lng già esistente o errore: {e}")
    
    # Crea tabella Permission se non esiste
    try:
        db.create_tables([Permission])
        print("✅ Creata tabella permission")
    except Exception as e:
        print(f"⚠️ Tabella permission già esistente o errore: {e}")
    
    db.close()
    print("✅ Migrazione completata!")

if __name__ == "__main__":
    migrate()
