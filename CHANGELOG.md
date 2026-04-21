# Completamento Sviluppo Full-Stack EV-SOH

Il progetto EV-SOH è stato completamente trasformato in una solida piattaforma Full-Stack. I dati simulati e i componenti statici sono stati rimossi in favore di una connessione dinamica, affidabile e sicura a un database effettivo, pronto per l'implementazione sul web.

## Architettura Creata

### 1. Database Relazionale (Prisma + SQLite/PostgreSQL)
L'intera struttura dati è stata modellata e resa funzionante nel backend:
- **`User`**: Account utente, gestione permessi (Admin vs Standard), integrazione con password cifrate (Bcryptjs).
- **`Vehicle`**: Tabelle in terza forma normale per evitare ripetizione di marchi e modelli.
- **`SohEntry`**: Misurazioni cronologiche dell'SOH protette e collegate in relazione uno-a-molti agli utenti e ai veicoli.
- **`ModerationFlag`**: Struttura speciale che incapsula automaticamente misurazioni la cui analisi matematica suggerisce alterazioni.

### 2. Backend Engine (Express.js)
Un motore API RESTful è stato implementato all'indirizzo `http://localhost:3005` per sostenere ogni singola schermata della GUI:
- **Sicurezza in primo piano**: Cors configurato, helmet, Express Rate Limiter e JWT per protezione token. Nessun router può essere consumato incautamente.
- **Regressione Esponenziale Scalabile**: Il calcolo del degrado della batteria con Z-Score (curva esponenziale) è stato traslato sul backend per intercettare *alla fonte* valori falsati prima ancora che vengano salvati come confermati.
- **Moduli API**: 
  - `POST /api/auth/...` (Login/Signup sicuri).
  - `GET /api/soh/...` (Explorazione, Dashboard personali).
  - `POST /api/soh/entry` (Con check regressione automatico integrato).
  - `GET /api/moderation/...` (Per il pannello di controllo degli amministratori).
  - `GET /api/analytics/...` (Aggregazioni per i grafici statistici).

### 3. Ripensamento Front-End (Vite + React)
L'interfaccia utente è stata snellita e collegata stabilmente alle API:
- Proxy centralizzato configurato nel `vite.config.ts`.
- L'intera logica statica è stata purificata (`MOCK_ENTRIES` eliminato).
- Aggiornati progressivamente: `AuthContext`, `Explore`, `Register`, `DataExplorer`, `Benchmarks`, `Moderation`, `Settings`, e `VehicleDetail`.
- Rispettati fedelmente pattern e componenti estetici originali, semplicemente alimentandoli di veri dati.

## Valutazioni sulla Sicurezza e Robustezza

La piattaforma ora rispetta le direttive e gli standard di qualità imposti:
- **Dato Affidabile**: Solo le entry `APPROVED` (per regressione positiva o promozione esplicita degli Admin) inficiano il database statistico, rendendo la curva affidabile e mai irrealistica.
- **Sicurezza Account**: Nessun transito di password passivo, completa tokenizzazione della sessione.

## Utilizzo

Per usufruire della nuova piattaforma web, basterà lanciare i seguenti comandi via terminale nella repository per mandare in esecuzione Front-end e Back-end in parallelo.
```bash
npm run dev
npm run dev:server
```
