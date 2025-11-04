from database import db
from models import Group, User, Event, Task

def create_tables():
    """Crea le tabelle nel database"""
    db.connect()
    db.create_tables([Group, User, Event, Task])
    
    # Crea solo gruppo di default se non esiste
    if not Group.select().exists():
        Group.create(name="Scout Planner", type="clan", description="Gruppo principale")
    
    db.close()

if __name__ == "__main__":
    create_tables()
    print("Database inizializzato!")