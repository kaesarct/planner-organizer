# Scout Planner

App web integrata per la gestione di eventi, task e documenti per comunità scout AGESCI.

## 🚀 Avvio con Docker

```bash
docker-compose up --build
```

Accedi a: **http://localhost:8000**

## 🏗️ Architettura

- **Backend**: FastAPI + Jinja2 + SQLAlchemy + PostgreSQL
- **Frontend**: HTML + Bootstrap + JavaScript (integrato)
- **Database**: PostgreSQL
- **Templates**: Jinja2 per rendering server-side

## 📁 Struttura

```
scout-planner/
├── models/         # Modelli SQLAlchemy
├── schemas/        # Pydantic schemas
├── routers/        # API + Web routes
├── templates/      # Template Jinja2
├── static/         # CSS + JS + Assets
├── database/       # SQL schema
├── main.py         # FastAPI app
├── requirements.txt
└── docker-compose.yml
```

## 🎯 Funzionalità

- **Dashboard**: Overview e statistiche
- **Gestione Eventi**: Riunioni, uscite, campi
- **Sistema Task**: Assegnazione e monitoraggio
- **Multi-Gruppo**: Supporto clan e comunità capi
- **Permessi**: Ruoli Admin, Capi, Staff, Ragazzi

## 🎨 Design

- **Bootstrap 5** per UI responsive
- **Colori Scout**: Verde #2E7D32, Marrone #8D6E63, Arancione #FF8F00
- **Template Jinja2** per rendering server-side
- **JavaScript vanilla** per interattività

## 🔧 Sviluppo

### Avvio manuale
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database
Inizializzato automaticamente con `database/schema.sql`

---

**Scout Planner** - Gestione scout semplificata 🏕️