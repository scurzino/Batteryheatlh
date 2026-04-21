<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EV-SOH: Piattaforma per il Monitoraggio della Salute delle Batterie

Benvenuto nel progetto EV-SOH (State of Health). Questa applicazione è una piattaforma Full-Stack completa per il monitoraggio, l'analisi e la gestione dei dati relativi al degrado delle batterie dei veicoli elettrici (EV).

Il progetto si è evoluto da un semplice prototipo front-end a una solida architettura web con database relazionale, API RESTful sicure e analisi dei dati integrata.

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