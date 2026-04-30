# EV-SOH Platform — Codebase Review & English Translation Plan

## Architecture Overview

The **EV-SOH Community Platform** is a full-stack web application for sharing and analyzing electric vehicle battery State-of-Health data.

```mermaid
graph TD
    subgraph Frontend ["Frontend (Vite + React + TypeScript)"]
        A[App.tsx] --> B[Layout.tsx]
        A --> C[SidebarLayout.tsx]
        B --> D[Explore]
        C --> E[VehicleDetail]
        C --> F[DataExplorer]
        C --> G[Benchmarks]
        C --> H[Settings]
        C --> I[Moderation]
        A --> J[Login]
        A --> K[SignUp]
        A --> L[Register]
    end

    subgraph Backend ["Backend (Express + Prisma)"]
        M[server/index.ts] --> N[auth.ts]
        M --> O[soh.ts]
        M --> P[moderation.ts]
        M --> Q[analytics.ts]
    end

    subgraph DB ["Database (PostgreSQL)"]
        R[(User)]
        S[(Vehicle)]
        T[(SohEntry)]
        U[(ModerationFlag)]
        V[(TripLog)]
        W[(VehicleNote)]
    end

    Frontend -->|JWT + REST API| Backend
    Backend --> DB
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Recharts, Lucide icons, Motion |
| Backend | Express 4, Prisma 6.4, bcryptjs, jsonwebtoken |
| Database | PostgreSQL (via Prisma) |
| Deployment | Vercel (serverless functions via [api/index.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/api/index.ts) + Vite SPA) |
| Dev Server | Vite proxy on `:3000` → Express on `:3005` |

### Key Features
1. **Explore page** — Browse community SOH measurements with filters and sort
2. **Vehicle Detail** — Deep dive with scatter plots, regression curves, SOH history, trip logs, community notes
3. **Register wizard** — Multi-step data submission form (Vehicle → Usage → SOH → Confirm)
4. **Exponential regression** — Backend-side anomaly detection flags outliers (z > 2σ)
5. **Moderation** — Admin panel to approve/reject flagged entries
6. **Benchmarks** — Charts by model, mileage, region, charge type
7. **Data Explorer** — Sortable/filterable data table
8. **Auth** — JWT-based login/signup with bcrypt password hashing

---

## Code Quality Review

### ✅ Strengths
- Clean component architecture with good separation of concerns
- Proper auth middleware chain (JWT verification → role check)
- Backend regression analysis is a solid mathematical approach
- Prisma schema is well-normalized with proper relations
- Material Design 3–inspired theming via Tailwind CSS custom tokens
- Good use of `glass-panel`, `ghost-border`, `ambient-shadow` utility classes
- Rate limiting and Helmet security headers on backend

### ⚠️ Issues Found

#### High Priority
| # | Issue | File | Description |
|---|-------|------|-------------|
| 1 | **Sync login call** | [Login.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Login.tsx#L25-L32) | [login()](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/context/AuthContext.tsx#49-62) is async but called without `await` inside `setTimeout`. The `result` is a Promise, not the actual result. Login likely never works correctly. |
| 2 | **CORS wide open** | [server/index.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/index.ts#L17) | `cors({ origin: '*' })` should be restricted in production |
| 3 | **Hardcoded JWT secret** | [auth.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/auth.ts#L6) | Falls back to `'super-secret-development-key'` — risky if env var not set |
| 4 | **No input validation** | [soh.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/soh.ts#L73-L139) | [addEntry](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/soh.ts#73-141) trusts all body fields directly. No Zod validation despite Zod being a dependency |

#### Medium Priority
| # | Issue | File | Description |
|---|-------|------|-------------|
| 5 | **Excessive `any` types** | Multiple files | `useState<any>()` used extensively — lose type safety |
| 6 | **N+1 query** | [VehicleDetail.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/VehicleDetail.tsx#L70) | Re-fetches entire `/soh/explore` to find peers, instead of a dedicated endpoint |
| 7 | **Duplicate regression code** | [soh.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/soh.ts) + [regressionCheck.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/utils/regressionCheck.ts) | Same exponential fit algorithm exists in both frontend and backend |
| 8 | **Locale hardcoded** | Multiple files | `toLocaleString('it-IT')` and `toLocaleDateString('it-IT')` hardcoded |
| 9 | **Missing error boundaries** | All pages | No React Error Boundaries — unhandled JS errors crash the entire app |

#### Low Priority
| # | Issue | File | Description |
|---|-------|------|-------------|
| 10 | **Dead imports** | Various | Some unused imports (e.g., `Download` in DataExplorer) |
| 11 | **No pagination** | [soh.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/soh.ts#L142-L165) | [getExplore](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/server/soh.ts#142-166) fetches ALL entries and deduplicates in JS — won't scale |
| 12 | **Italian comments** | [regressionCheck.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/utils/regressionCheck.ts#L58) | Code comments in Italian |
| 13 | **Typo in directory** | Root | Project folder is `SOH_applciations` (typo: "applications") |

---

## Proposed Changes — English Translation

This translation is a **UI text-only change**. No logic, API contracts, or database schema will change. The values stored in the DB (like `usageType`, `chargeType`) remain in Italian since they're persisted data — changing them would be a breaking data migration, which is out of scope.

> [!IMPORTANT]
> **Data values (e.g. "Prevalentemente AC", "Urbano") are NOT translated** because they're stored in the database. Only user-facing labels, placeholders, headers, and messages are translated.

### Frontend Files

---

#### [MODIFY] [mockData.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/data/mockData.ts)
- Translate Italian comments to English
- Translate `COUNTRIES` array values to English names
- Leave [UsageType](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/data/mockData.ts#10-11), [ChargeType](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/data/mockData.ts#11-12), [MeasurementMethod](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/data/mockData.ts#12-13) type values unchanged (DB data)

---

#### [MODIFY] [Badge.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/components/ui/Badge.tsx)
- `Approvato` → `Approved`, `In Revisione` → `Under Review`, `Segnalato` → `Flagged`, `Rifiutato` → `Rejected`

---

#### [MODIFY] [Layout.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/components/layout/Layout.tsx)
- Nav: `Esplora` → [Explore](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Explore.tsx#19-261)
- Menu: `Impostazioni` → [Settings](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Settings.tsx#8-135), `Aggiungi misurazione` → `Add Measurement`, `Moderazione` → [Moderation](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Moderation.tsx#8-127), `Disconnetti` → `Log Out`, `Aggiungi` → [Add](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/VehicleDetail.tsx#156-187), `Accedi` → `Log In`, `Cerca modello…` → `Search model…`

---

#### [MODIFY] [SidebarLayout.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/components/layout/SidebarLayout.tsx)
- Same nav items as Layout: `Esplora` → [Explore](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Explore.tsx#19-261), `Impostazioni` → [Settings](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Settings.tsx#8-135), `Aggiungi misurazione` → `Add Measurement`, `Moderazione` → [Moderation](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Moderation.tsx#8-127), `Disconnetti` → `Log Out`, `Accedi` → `Log In`

---

#### [MODIFY] [Explore.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Explore.tsx)
- All headers, stat labels, filter labels, sort options, button text, empty states

---

#### [MODIFY] [Login.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Login.tsx)
- `Bentornato` → `Welcome Back`, `Accedi al tuo account EV-SOH` → `Sign in to your EV-SOH account`, all labels/buttons/errors

---

#### [MODIFY] [SignUp.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/SignUp.tsx)
- `Crea Account` → `Create Account`, `Unisciti alla community` → `Join the EV-SOH community`, all validation errors + labels

---

#### [MODIFY] [Register.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Register.tsx)
- Wizard steps: `Veicolo` → [Vehicle](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/data/mockData.ts#1-7), `Utilizzo` → [Usage](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/data/mockData.ts#10-11), `Conferma` → `Confirm`
- All field labels, placeholders, confirmation messages

---

#### [MODIFY] [VehicleDetail.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/VehicleDetail.tsx)
- Tabs: `Panoramica` → `Overview`, `Cronologia SOH` → `SOH History`, `Statistiche Utilizzo` → `Usage Stats`, `Note Comunità` → `Community Notes`
- All modal titles, labels, buttons, tooltips, chart text, error messages (~50+ strings)
- Change `toLocaleString('it-IT')` → `toLocaleString('en-US')`

---

#### [MODIFY] [Benchmarks.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Benchmarks.tsx)
- Tabs: `Per Modello` → `By Model`, `Per Regione` → `By Region`, `Per Tipo Ricarica` → `By Charge Type`
- Chart labels and headers

---

#### [MODIFY] [DataExplorer.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/DataExplorer.tsx)
- All filter labels, table headers, status names, empty state
- Change `toLocaleString('it-IT')` / `toLocaleDateString('it-IT')` → `en-US`

---

#### [MODIFY] [Moderation.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Moderation.tsx)
- `Accesso Negato` → `Access Denied`, `Area riservata ai moderatori` → `Reserved for moderators`
- All action buttons and status messages

---

#### [MODIFY] [Settings.tsx](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Settings.tsx)
- `Impostazioni` → [Settings](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/pages/Settings.tsx#8-135), `Profilo` → `Profile`, `Le mie misurazioni` → `My Measurements`
- All labels, buttons, empty states

---

#### [MODIFY] [regressionCheck.ts](file:///c:/Users/u31x07/Private/gemini%20scripts/SOH_applciations/src/utils/regressionCheck.ts)
- Translate Italian comment on line 58

---

## Verification Plan

### Automated Tests
- **Build check**: Run `npm run build` to ensure no TypeScript compilation errors after translation
- **Lint check**: Run `npx tsc --noEmit` to verify type safety

### Manual Verification
- After implementation, open the site in a browser and visually verify each page is fully in English
- Check: Explore, Login, SignUp, Register wizard (all 4 steps), Vehicle Detail (all 4 tabs + modals), Benchmarks (all 4 tabs), DataExplorer, Moderation, Settings
