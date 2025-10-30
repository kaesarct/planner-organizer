# 🚀 Scout Planner - Quick Start

## Avvio Rapido

### Windows
```bash
start.bat
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### Manuale
```bash
docker-compose up --build
```

## 🌐 Accesso

**Web**: http://localhost:8000
**API**: http://localhost:8001
**Docs**: http://localhost:8001/docs

## 📱 Funzionalità

- **Homepage**: Panoramica generale
- **Dashboard**: Statistiche e overview
- **Eventi**: Gestione riunioni, uscite, campi
- **Task**: Assegnazione e monitoraggio compiti

## 🗃️ Database

- **PostgreSQL** su porta 5432
- **Credenziali**: scout/scout123
- **Database**: scout_planner

## 🛠️ Sviluppo

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

---

**Scout Planner** pronto in 30 secondi! 🏕️