# TalentSync AI

[![CI](https://github.com/Vineel21/TalentSyncAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Vineel21/TalentSyncAI/actions/workflows/ci.yml)
[![Deploy production](https://github.com/Vineel21/TalentSyncAI/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/Vineel21/TalentSyncAI/actions/workflows/deploy-production.yml)

TalentSync AI is a full-stack recruitment platform for candidate onboarding, job discovery, application tracking, recruiter workflows, hiring analytics, and AI-assisted resume review.

## Live demo

| Service | URL |
| --- | --- |
| Web application | [talentsync-ai-chi.vercel.app](https://talentsync-ai-chi.vercel.app) |
| API health | [talentsync-api-wqk7.onrender.com/api/v1/health](https://talentsync-api-wqk7.onrender.com/api/v1/health) |
| Source | [github.com/Vineel21/TalentSyncAI](https://github.com/Vineel21/TalentSyncAI) |

The API runs on Render's free plan and may respond slowly on the first request after inactivity.

## Features

### Candidate

- Email/password authentication with protected routes and session recovery
- Three-step onboarding with resume-assisted or manual profile creation
- Editable profile, experience, education, skills, and certifications
- Job search, filters, saved jobs, recommendations, and match evidence
- Application submission, status tracking, withdrawal, and notifications
- Dashboard with profile completion, saved jobs, and recent activity

### Recruiter

- Role-protected recruiter workspace
- Job creation, editing, publishing, closing, and soft deletion
- Applicant review with profile and submitted-resume access
- Pipeline status management from application through offer or rejection
- AI-assisted summaries, match scores, and resume feedback
- Dashboard metrics and responsive hiring analytics

The public, authentication, onboarding, candidate, and recruiter interfaces are responsive across mobile, tablet, and desktop layouts.

## Demo access

The seeded accounts and data are synthetic. These are public, test-only credentials; never reuse the password outside this demo.

**Shared password:** `TalentSyncDemo!2026#Login`

### Recruiters

| Name | Company | Email |
| --- | --- | --- |
| Maya Nair | NovaStack Labs | `maya.recruiter@talentsync.test` |
| Arjun Rao | FinEdge Analytics | `arjun.recruiter@talentsync.test` |
| Priya Menon | CareGrid Health | `priya.recruiter@talentsync.test` |

### Candidates

| Name | Scenario | Email |
| --- | --- | --- |
| Aarav Sharma | Frontend fresher | `aarav.fresher@talentsync.test` |
| Meera Iyer | Senior backend engineer | `meera.backend@talentsync.test` |
| Rohan Gupta | Data analyst | `rohan.data@talentsync.test` |
| Sana Khan | Product designer | `sana.design@talentsync.test` |
| Vikram Singh | DevOps / SRE engineer | `vikram.cloud@talentsync.test` |
| Nisha Patel | QA automation career switcher | `nisha.qa@talentsync.test` |
| Kavya Reddy | Healthcare product analyst | `kavya.health@talentsync.test` |

The demo dataset contains three recruiters, seven candidates, eight resumes, nine jobs, 22 applications across all seven statuses, 22 AI-analysis rows, notifications, and recruiter analytics.

## Architecture

```text
React + Vite SPA (Vercel)
          |
          | HTTPS /api/v1
          v
Express + TypeScript API (Render)
  routes -> validation -> controllers -> services -> repositories
          |
          +--> Supabase Auth
          +--> PostgreSQL + Row Level Security
          +--> Private Supabase Storage
          `--> Google Gemini (backend only)
```

The frontend communicates only with the Express API. Controllers handle HTTP concerns, services own business logic, and repositories access Supabase. Authentication and role checks are enforced by the API, with PostgreSQL RLS providing the final data-access boundary.

### Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router |
| Data and forms | TanStack Query, Axios, React Hook Form, Zod |
| UI | shadcn-style components, Radix Slot, Framer Motion, Recharts |
| Backend | Node.js 22, Express 5, TypeScript, Zod |
| Data | Supabase Auth, PostgreSQL, RLS, private Storage |
| AI | Google Gemini through `@google/genai` |
| Testing | Vitest, Testing Library, Supertest |
| Delivery | GitHub Actions, Vercel, Render |

### Repository layout

```text
.
|-- .github/workflows/       # CI and production deployment
|-- backend/
|   |-- src/modules/         # Feature-based API modules
|   |-- src/scripts/         # Demo seed and guarded data reset
|   `-- tests/               # Backend tests
|-- frontend/
|   `-- src/
|       |-- components/      # Shared UI
|       |-- features/        # Feature components and state
|       |-- layouts/         # Public and authenticated shells
|       |-- pages/           # Route-level pages
|       |-- routes/          # Role and onboarding guards
|       `-- services/        # Typed API clients
|-- supabase/migrations/     # Versioned database schema
|-- render.yaml              # Render API configuration
`-- vercel.json              # Vercel build, SPA, and API proxy rules
```

## Quick start

### Requirements

- Node.js 22 or newer
- npm 10 or newer
- A hosted Supabase project, or Supabase CLI and Docker for a local stack

### 1. Install

```bash
git clone https://github.com/Vineel21/TalentSyncAI.git
cd TalentSyncAI
npm ci
```

### 2. Configure environment files

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

macOS or Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set these backend values:

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable or legacy anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only privileged key |
| `FRONTEND_URL` | Allowed frontend origin, normally `http://localhost:5173` |

The complete optional configuration is documented in [`backend/.env.example`](backend/.env.example). The frontend defaults to `VITE_API_URL=/api/v1`, which Vite proxies to the local API.

AI features call Gemini from the backend. The default `assessment` mode disables provider calls and does not require a Gemini key; running the demo seeder supplies synthetic analysis fixtures. To enable provider calls, configure `AI_PROCESSING_MODE=live`, `GEMINI_SERVICE_TIER=paid`, and `GEMINI_API_KEY` as described in the backend environment example.

Never commit `.env` files or expose privileged keys to the frontend.

### 3. Apply migrations

Local Supabase:

```bash
npx supabase start
npx supabase db reset --local
```

Linked development project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Migration files in `supabase/migrations` are authoritative. Never modify an already-applied migration; create a new migration for each schema change.

### 4. Run the applications

Start each process from the repository root in a separate terminal:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

- Frontend: `http://localhost:5173`
- API health: `http://localhost:4000/api/v1/health`

## Developer commands

Run all commands from the repository root.

| Command | Purpose |
| --- | --- |
| `npm run dev:frontend` | Start the Vite development server |
| `npm run dev:backend` | Start the Express development server |
| `npm run format:check` | Check Prettier formatting |
| `npm run lint` | Lint both workspaces |
| `npm run typecheck` | Type-check frontend, backend, and tests |
| `npm run test` | Run all Vitest suites |
| `npm run build` | Build both workspaces |
| `npm run check` | Run lint, type-check, tests, and builds |
| `npm run seed:demo --workspace backend -- --apply` | Seed and verify the synthetic dataset |
| `npm run reset:data --workspace backend` | Preview the guarded data reset |

## Demo data

Seed the full dataset with the documented demo password:

```powershell
$env:DEMO_SEED_PASSWORD='TalentSyncDemo!2026#Login'
npm run seed:demo --workspace backend -- --apply
Remove-Item Env:DEMO_SEED_PASSWORD
```

If `DEMO_SEED_PASSWORD` is omitted, the seeder generates credentials and prints them after verification.

The reset command preserves migrations and database objects while removing all application rows, all Supabase Auth users, and every object in the configured resume bucket. Preview the target first:

```powershell
npm run reset:data --workspace backend
```

For an intentional remote development or test reset:

```powershell
$env:DATA_RESET_ALLOWED_PROJECT_REF='<project-ref>'
npm run reset:data --workspace backend -- --apply --allow-remote --confirm=RESET_ALL_DATA_<project-ref>
Remove-Item Env:DATA_RESET_ALLOWED_PROJECT_REF
```

The reset script rejects production mode. Treat it as destructive and never point it at a production project.

## API overview

All endpoints are versioned under `/api/v1`. Requests are validated with Zod and responses use a consistent envelope:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

Errors use the same envelope with `success: false` and a stable error code inside `data`.

| Route group | Responsibility |
| --- | --- |
| `GET /health` | Public health check |
| `/auth` | Registration, login, refresh, logout, current user |
| `/profile` | Candidate profile and authorized applicant profile |
| `/onboarding` | Progress, recommendations, completion |
| `/resume` | Upload, parse, and authorized private download |
| `/jobs` | Public discovery and recruiter job lifecycle |
| `/saved-jobs` | Candidate bookmarks |
| `/applications` | Apply, list, status transitions, withdrawal |
| `/ai` | Match score, candidate summary, resume feedback |
| `/dashboard` | Role-specific dashboards |
| `/notifications` | List, read state, and deletion |

Access tokens use the `Authorization: Bearer <token>` header. Refresh tokens are stored in HTTP-only cookies with `Secure` enabled in production.

## Testing and CI

Run the complete local quality gate:

```bash
npm run format:check
npm run check
```

The [CI workflow](https://github.com/Vineel21/TalentSyncAI/actions/workflows/ci.yml) runs formatting, linting, type checking, tests, production builds, and a clean database rebuild from the committed Supabase migrations.

## Deployment

| Component | Provider | Configuration |
| --- | --- | --- |
| Frontend | Vercel | `vercel.json` |
| Backend | Render | `render.yaml` |
| Auth, database, storage | Supabase | `supabase/migrations` |

Production flow:

1. Pushes to `main` and all pull requests run CI.
2. After successful `main` checks, Render builds and health-checks the API from the repository configuration.
3. A successful `main` CI run triggers `.github/workflows/deploy-production.yml`.
4. GitHub Actions builds the Vercel artifact, deploys it, and smoke-tests the public frontend and API proxy.

Render requires these secret environment variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

GitHub Actions requires:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

For Supabase Auth, set the Site URL and allowed redirect URL to the deployed Vercel origin. Vercel proxies `/api/*` to the Render service, so browser traffic uses one public origin.

## Security

- Supabase Auth validates identities; trusted roles are stored in application-controlled data.
- API middleware and PostgreSQL RLS enforce candidate and recruiter authorization.
- Service-role and Gemini credentials remain server-only.
- Resume files are stored privately and validated as PDFs with a 5 MiB limit.
- Refresh sessions use HTTP-only cookies with `Secure` enabled in production.
- Zod validation, rate limiting, Helmet, CORS, and centralized error handling protect the API boundary.
- Demo identities are marked synthetic and should be removed or isolated before accepting real users.

## MVP limitations

- The public demo uses seeded AI output; live Gemini processing is disabled until live provider configuration is supplied.
- Application records store the current status rather than a complete status-event history.
- Password reset, social login, interview scheduling, administrator tools, background jobs, and production alerting are outside the current MVP.
