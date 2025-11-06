# 🏕️ Clan Planner

App web per la gestione di eventi e task per clan scout AGESCI su **Firebase**.

## 🚀 Quick Start

### 1. Setup Firebase
```bash
npm install -g firebase-tools
firebase login
```

### 2. Configura progetto
1. Vai su https://console.firebase.google.com
2. Clicca "Aggiungi progetto"
3. Nome: **clan-planner**
4. Abilita Google Analytics (opzionale)

### 3. Inizializza Firebase
```bash
firebase init
```

Seleziona:
- ✅ Firestore
- ✅ Hosting

### 4. Ottieni configurazione Firebase
1. Firebase Console > Impostazioni progetto
2. Scorri fino a "Le tue app"
3. Clicca sull'icona web `</>`
4. Copia la configurazione e incolla in `public/js/app.js`

### 5. Abilita Authentication
1. Firebase Console > Authentication
2. Clicca "Inizia"
3. Abilita "Email/Password"
4. Vai su Templates e configura email di verifica

### 6. Deploy
```bash
firebase deploy
```

### 7. Accedi
`https://clan-planner.web.app`

## 🏗️ Architettura

- **Frontend**: HTML + Bootstrap + JavaScript (Firebase Hosting)
- **Database**: Firestore (NoSQL)
- **Auth**: Firebase Authentication con verifica email
- **Real-time**: Aggiornamenti automatici

## 📁 Struttura

```
clan-planner/
├── public/              # Frontend statico
│   ├── index.html       # SPA principale
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js       # Firebase SDK + logica
├── firestore.rules      # Security rules
├── firestore.indexes.json
├── firebase.json
└── README.md
```

## 🎯 Funzionalità

✅ **Dashboard**: Overview e statistiche real-time  
✅ **Gestione Eventi**: Riunioni, uscite, campi con calendario  
✅ **Sistema Task**: Kanban board con 4 stati  
✅ **Authentication**: Email/Password con verifica email  
✅ **Permessi**: Ruoli Admin, Reviewer, Base  
✅ **Mappe**: Integrazione OpenStreetMap e Google Maps  
✅ **Calendario**: Export Google Calendar e iCal  

## 📊 Database Firestore

### Collection: users
```javascript
{
  uid: string,
  name: string,
  email: string,
  role: "base" | "reviewer" | "admin",
  created_at: timestamp
}
```

### Collection: events
```javascript
{
  title: string,
  description: string,
  type: "riunione" | "uscita" | "campo" | "consiglio",
  start_date: string (datetime-local),
  end_date: string (datetime-local),
  location: string,
  location_lat: number,
  location_lng: number,
  created_by: string (uid),
  created_at: timestamp
}
```

### Collection: tasks
```javascript
{
  title: string,
  description: string,
  status: "pending" | "in_progress" | "completed" | "cancelled",
  priority: "low" | "medium" | "high",
  due_date: string (date),
  assigned_to: string (uid),
  created_by: string (uid),
  visible: boolean,
  created_at: timestamp
}
```

### Collection: permissions
```javascript
{
  // Document ID: "base" | "reviewer" | "admin"
  event_create: boolean,
  event_edit: boolean,
  event_delete: boolean,
  event_field_title: boolean,
  event_field_description: boolean,
  event_field_type: boolean,
  event_field_location: boolean,
  event_field_start_date: boolean,
  event_field_end_date: boolean,
  task_create: boolean,
  task_edit: boolean,
  task_delete: boolean,
  task_field_title: boolean,
  task_field_description: boolean,
  task_field_status: boolean,
  task_field_priority: boolean,
  task_field_due_date: boolean,
  task_field_assigned: boolean
}
```

## 🔒 Security Rules

Le regole Firestore garantiscono:
- Solo utenti autenticati possono accedere
- Admin/Reviewer possono creare eventi
- Gli utenti possono modificare solo i propri task
- Solo admin possono modificare i permessi

## 🎨 Design

- **Bootstrap 5** per UI responsive
- **Colori Scout**: Verde #2E7D32
- **SPA** con routing client-side
- **Firebase SDK** per real-time data

## 💰 Costi

**Piano Spark (Gratuito)**:
- 50K letture/giorno Firestore
- 20K scritture/giorno
- 1GB storage
- 10GB hosting/mese

Perfetto per clan scout! 🎯

## 🛠️ Comandi Utili

```bash
# Deploy completo
firebase deploy

# Deploy singolo
firebase deploy --only hosting
firebase deploy --only firestore:rules

# Logs
firebase functions:log

# Emulatori locali
firebase emulators:start
```

---

**Clan Planner** - Gestione clan nel cloud! ☁️🏕️
