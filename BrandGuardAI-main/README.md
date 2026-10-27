# BrandGuard AI — Enterprise Brand Compliance Platform

BrandGuard AI is a full-stack, AI-powered brand compliance and copy risk analysis platform. It analyzes marketing materials, ad campaigns, slogans, and copy against brand rules, approved facts, and legal disclaimers before publication.

---

## Architecture Overview

```
BrandGuardAI/
├── src/                     # Frontend: React 18 + Vite + Tailwind CSS
│   ├── components/          # TopBar, Sidebar, Badges, Toast, ConfirmDialog
│   ├── pages/               # Dashboard, NewAudit, AuditResults, Correction, Guidelines, Review, History, Analytics, Settings
│   ├── lib/
│   │   ├── api.ts           # Typed API client connected to backend /api
│   │   ├── store.ts         # Hybrid in-memory + reactive sync store
│   │   ├── auditEngine.ts   # Deterministic fallback audit engine
│   │   └── metrics.ts       # Compliance metrics calculation
│   └── App.tsx
├── server/                  # Backend: Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/          # Environment variables & constants
│   │   ├── db/              # MySQL connection pool, repository & migrations
│   │   ├── routes/          # REST endpoints (/api/audits, /api/brands, /api/health, /api/analytics)
│   │   └── services/        # Google Gemini AI integration + fallback logic
│   ├── .env.example         # Template for environment variables
│   └── package.json
└── package.json
```

---

## Getting Started

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=3001

# Google Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_DATABASE=brandguard_db
```

### 3. Initialize MySQL Database (Optional / When MySQL is Configured)
If you have MySQL credentials set in `server/.env`:
```bash
npm run server:migrate
```
*Note: If MySQL is not configured or credentials are empty, the backend automatically runs in a resilient in-memory mode seeded with default NovaTech brand data.*

### 4. Run Both Servers

Open two terminals:

**Terminal 1 — Backend API Server:**
```bash
npm run server
# Server starts on http://localhost:3001
```

**Terminal 2 — Frontend Application:**
```bash
npm run dev
# Frontend starts on http://localhost:5173
```

---

## Operational Modes

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **Live AI + MySQL** | Both `GEMINI_API_KEY` and MySQL credentials configured. | Real-time generative AI compliance auditing with relational persistence. |
| **Live AI + In-Memory** | `GEMINI_API_KEY` provided; MySQL credentials pending. | Real-time Gemini AI auditing; records stored in backend memory & browser cache. |
| **Deterministic Demo** | No `GEMINI_API_KEY` provided. | Rule-based regex audit engine against active brand guidelines; results transparently labelled "Simulated". |

---

## REST API Endpoints

- `GET /api/health`: System status of server, MySQL, and Gemini AI.
- `GET /api/brands` & `POST /api/brands`: Brand management.
- `GET /api/guidelines` & `PUT /api/guidelines/:id`: Compliance guidelines CRUD.
- `GET /api/audits`: List past audits with search, status, type, and severity filters.
- `POST /api/audits`: Create new audit draft.
- `POST /api/audits/:id/run`: Run AI / deterministic audit.
- `PUT /api/audits/:id/revisions`: Save revised draft copy.
- `PUT /api/audits/:id/findings/:findingId`: Update status of individual finding (Open, Resolved, Ignored).
- `POST /api/audits/:id/approval`: Workflow actions (`submit`, `approve`, `request-changes`, `reject`).
- `GET /api/analytics`: Aggregated compliance rates, trends, and severity breakdowns.
- `POST /api/settings/reset`: Reset back to clean seed data.
