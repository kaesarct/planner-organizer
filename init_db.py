from database import db
from models import Group, User, Event, Task

def create_tables():
    """Crea le tabelle nel database"""
    db.connect()
    db.create_tables([Group, User, Event, Task])
    
    # Inserisci dati di esempio
    if not Group.select().exists():
        Group.create(name="Clan Aquile", type="clan", description="Clan scout principale")
        Group.create(name="Comunità Capi", type="comunita_capi", description="Comunità dei capi educatori")
    
    if not User.select().exists():
        clan = Group.get(Group.name == "Clan Aquile")
        User.create(
            email="admin@scout.it",
            name="Admin Scout", 
            hashed_password="$2b$12$hash",
            role="admin",
            group=clan.id
        )
        User.create(
            email="capo@scout.it",
            name="Capo Gruppo",
            hashed_password="$2b$12$hash", 
            role="capi",
            group=clan.id
        )
    
    # Crea task di esempio se non esistono
    if not Task.select().exists():
        from datetime import datetime, timedelta
        user = User.select().first()
        if user:
            Task.create(
                title="Preparare materiale per uscita",
                description="Controllare zaini, corde e materiale da campo",
                priority="high",
                due_date=datetime.now() + timedelta(days=2),
                assigned_to=user.id,
                created_by=user.id
            )
            Task.create(
                title="Organizzare riunione capi",
                description="Pianificare agenda e inviare convocazioni",
                priority="medium",
                due_date=datetime.now() + timedelta(days=5),
                status="in_progress",
                assigned_to=user.id,
                created_by=user.id
            )
    
    db.close()

if __name__ == "__main__":
    create_tables()
    print("Database inizializzato!")