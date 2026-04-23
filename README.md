<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EV-SOH Community Platform - Full-Stack Edition

La piattaforma **EV-SOH** (State of Health per Veicoli Elettrici) è una web application full-stack creata per la raccolta collettiva di misurazioni sullo stato di salute delle batterie, dotata di validazione matematica dei dati.

## 🛠️ Tecnologie
- **Front-end**: React + TypeScript + Vite + TailwindCSS
- **Back-end**: Node.js + Express.js + Rate Limiting / Helmet + JWT
- **Database**: Prisma ORM + SQLite (configurabile per PostgreSQL)

## ▶️ Installazione e Utilizzo

**Prerequisiti:** `Node.js` v18+ installato.

1. **Clona e Installa:**
   ```bash
   npm install
   ```

2. **Inizializza il Database:**
   Genera le tabelle SQLite nel file `dev.db` e i client Prisma:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Inizializza gli Utenti (Demo e Admin):**
   ```bash
   npx tsx prisma/seed.ts
   ```
   *In questo modo verranno creati: l'utente base `marco@example.it (psw: password)` e l'amministratore `admin@ev-soh.it (psw: admin123)`.*

4. **Avvia la Piattaforma (Client + Server contemporaneamente):**
   ```bash
   npm run dev:all
   ```
   
   - L'interfaccia utente è disponibile su `http://localhost:3000`
   - Le API del Backend rispondono su `http://localhost:3005`

## 🚀 Funzionalità Principali

* **Gestione Utenti Sicura:** Sistema di registrazione e login con password cifrate (Bcrypt) e sessioni protette tramite JWT. Gestione dei ruoli (Utente Standard vs Amministratore).
* **Motore di Analisi (Z-Score):** Calcolo automatico della regressione esponenziale per intercettare misurazioni dello State of Health (SOH) anomale o falsate prima che vengano salvate nel database.
* **Pannello di Moderazione:** Gli amministratori possono esaminare, approvare o scartare le misurazioni contrassegnate automaticamente dal sistema.
* **Esplorazione Dati & Grafici:** Visualizzazione interattiva dei dati e benchmark tramite dashboard personalizzate.

## 🛠️ Tecnologie Utilizzate

L'applicazione utilizza uno stack moderno:

**Front-End:**
* [React](https://react.dev/) (v19)
* [Vite](https://vitejs.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [React Router](https://reactrouter.com/)

**Back-End:**
* [Express.js](https://expressjs.com/) (Server API RESTful)
* Sicurezza: `helmet`, `cors`, `express-rate-limit`

**Database & Dati:**
* [Prisma ORM](https://www.prisma.io/)
* SQLite / PostgreSQL

## ⚙️ Come Installare e Avviare il Progetto

**Prerequisiti:** Node.js installato.

**1. Installa le dipendenze**
Apri il terminale nella cartella del progetto e avvia:
```bash
npm install