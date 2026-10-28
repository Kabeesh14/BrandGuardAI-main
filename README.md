# BrandGuard AI — AI-Powered Brand Compliance Platform

BrandGuard AI is an AI-powered platform that helps organizations review marketing content and ensure it follows their brand guidelines. It identifies unsupported claims, prohibited words, tone inconsistencies, missing disclaimers, and other potential compliance issues before content is published.

The platform combines AI-assisted auditing, automated compliance checks, correction suggestions, human review workflows, and analytics in a centralized application.

## 🚀 Features

- **AI-Powered Content Auditing:** Analyze marketing content using Google's Gemini API.
- **Brand Guidelines Management:** Create and manage brand rules and compliance guidelines.
- **Compliance Findings:** Identify unsupported claims, prohibited terms, tone inconsistencies, and potential policy violations.
- **Risk Assessment:** Display compliance results and risk scores to help prioritize findings.
- **Correction Workspace:** Review findings and prepare improved content.
- **Human Review and Approval:** Support review, status updates, and approval workflows.
- **Audit History:** Maintain records of content audits and their findings.
- **Analytics Dashboard:** Visualize compliance trends and audit statistics.
- **Light and Dark Modes:** Switch between visual themes.
- **Authentication and Role-Based Access:** Support different permission levels for content creators, reviewers, and administrators.
- **Persistent Storage:** Store brands, guidelines, audits, findings, revisions, and approval events in MySQL.

> AI-generated findings are intended to assist human reviewers. They should be verified before marketing content is approved or published.

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- CSS
- Lucide icons
- Recharts

### Backend
- Node.js
- Express.js
- TypeScript
- Zod
- Google Gemini API
- Firebase Authentication / Firebase Admin SDK
- JSON Web Tokens for supported authentication flows

### Database
- MySQL

### Deployment
- Vercel — frontend
- Render — backend API
- Managed cloud MySQL — production database

## 📁 Project Structure

The project uses a frontend and backend architecture. The exact folder nesting may vary depending on the repository layout.

```text
BrandGuardAI-main/
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── ...
├── public/
├── server/
│   ├── src/
│   │   ├── auth/
│   │   ├── routes/
│   │   └── ...
│   ├── testAuthSecurity.cjs
│   ├── .env.example
│   └── package.json
├── package.json
├── vite.config.ts
└── README.md
```

## ⚙️ Prerequisites

Install the following before running the project locally:

- Node.js and npm
- MySQL Server
- Git
- A Google Gemini API key
- Firebase project and authentication credentials if using Firebase Authentication

## 💻 Local Installation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd BrandGuardAI-main
```

Replace the placeholder URL with your actual GitHub repository URL.

If your repository contains a nested `BrandGuardAI-main` directory, enter the inner project directory before running the commands below.

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the backend

Navigate to the server directory:

```bash
cd server
npm install
```

Create a `.env` file using the provided example:

```bash
cp .env.example .env
```

On Windows, you can also copy `.env.example` to `.env` using File Explorer.

Configure the required environment variables using the actual names defined in the backend configuration.

### 4. Configure MySQL

Create a database in your local MySQL server using the database name expected by the backend configuration.

For example:

```sql
CREATE DATABASE brandguard_db;
```

Configure the connection details in `server/.env`. Run the project's documented migrations or schema initialization process if required.

**Important:** Do not run destructive migrations against an existing production database without a backup and explicit verification of the target database.

### 5. Configure Gemini

Create a Gemini API key through Google's official AI developer platform and configure it in the backend environment using the exact variable name expected by the application.

Never expose the API key in frontend code, public repositories, or client-side environment variables.

### 6. Configure authentication

If Firebase Authentication is enabled, configure the Firebase project and backend Admin SDK credentials using the documented environment variables.

Production authentication must verify user identity on the server and enforce role permissions on protected routes. Do not rely on a frontend role selector to authorize privileged actions.

## ▶️ Running the Application

The exact scripts depend on the `scripts` sections in the frontend and backend `package.json` files.

Start the backend from the `server` directory using its configured development script. For example, if supported:

```bash
npm run dev
```

Start the frontend in a separate terminal from the frontend project directory:

```bash
npm run dev
```

Vite commonly serves the frontend at:

```text
http://localhost:5173
```

The backend may run at:

```text
http://localhost:3001
```

Use the actual port configured by the application.

## 🔌 API

The backend provides REST API endpoints for application operations.

The following endpoint is documented by the project:

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Check API and service health |

Other API routes cover areas such as brands, guidelines, audits, findings, revisions, approvals, authentication, and analytics. Their exact methods, request schemas, and authorization requirements should be verified against the current backend implementation.

## 🌐 Deployment

### Frontend — Vercel

The frontend is deployed at:

**https://brand-guard-ai-kabeesh.vercel.app/**

General deployment steps:

1. Import the GitHub repository into Vercel.
2. Select the directory containing the frontend's `package.json` and `vite.config.ts`.
3. Choose the Vite framework preset.
4. Configure the build command as `npm run build` and output directory as `dist`, if those match the project configuration.
5. Configure the frontend API base URL using the exact environment variable expected by the frontend.
6. Redeploy after changing environment variables.

### Backend — Render

1. Create a Render Web Service connected to the GitHub repository.
2. Select the directory containing the backend's `package.json`.
3. Configure the build and start commands according to the backend's actual npm scripts.
4. Add the required production environment variables in Render.
5. Configure CORS to allow the deployed Vercel frontend origin.
6. Verify the API health endpoint after deployment.

### Production Database

Use a managed cloud MySQL database for production. Configure secure database credentials and verified TLS. A MySQL server running on a developer's laptop is not directly accessible to a hosted backend through `localhost`.

Before public deployment, verify production authentication, role-based authorization, CORS restrictions, secret management, and database connectivity.

## 🔐 Security

- Store API keys, database passwords, authentication secrets, and private keys only in secure environment variables or an appropriate secrets manager.
- Never commit `.env` files or Firebase service-account JSON files.
- Rotate credentials if they have been exposed in Git history or shared publicly.
- Validate incoming API requests on the server.
- Enforce authorization on every protected backend route.
- Use HTTPS and verified TLS for production connections.
- Keep dependencies updated and review security advisories.
- Avoid logging credentials, tokens, or sensitive user information.

## 🧪 Testing

Run the project's available tests using the scripts defined in the frontend and backend `package.json` files.

Recommended verification includes:

- Frontend build and TypeScript checks
- Backend build and API health checks
- Authentication and authorization tests
- Brand guideline and audit workflow tests
- MySQL persistence tests
- Production configuration and security checks

Only report tests as passing when they have actually been executed successfully.

## 🎯 Project Objective

The objective of BrandGuard AI is to reduce manual brand-compliance review effort, identify potentially risky marketing claims, improve content consistency, and help teams maintain reliable brand standards through AI-assisted analysis and human approval.

## 👨‍💻 Author

**Kabeesh L**

GitHub: [Kabeesh14](https://github.com/Kabeesh14)

## 📄 License

Choose and add a license appropriate to the project's distribution and intended use before publishing the repository as open source.
