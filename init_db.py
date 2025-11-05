from database import db
from models import Group, User, Event, Task
from models.permission import Permission
from models.event_type import EventType

def create_tables():
    """Crea le tabelle nel database"""
    db.connect()
    db.create_tables([Group, User, Event, Task, Permission, EventType])
    
    # Migrazione: aggiungi colonne coordinate se non esistono
    try:
        db.execute_sql('ALTER TABLE event ADD COLUMN location_lat REAL')
        print("✅ Aggiunta colonna location_lat")
    except:
        pass
    
    try:
        db.execute_sql('ALTER TABLE event ADD COLUMN location_lng REAL')
        print("✅ Aggiunta colonna location_lng")
    except:
        pass
    
    # Crea solo gruppo di default se non esiste
    if not Group.select().exists():
        Group.create(name="Scout Planner", type="clan", description="Gruppo principale")
    
    # Crea tipi evento di default se non esistono
    default_types = [
        ('riunione', 'primary'),
        ('uscita', 'success'),
        ('campo', 'warning'),
        ('consiglio', 'danger')
    ]
    for name, color in default_types:
        EventType.get_or_create(name=name, defaults={'color': color})
    
    db.close()

if __name__ == "__main__":
    create_tables()
    print("Database inizializzato!")