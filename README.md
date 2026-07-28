# TalentSync AI

[![CI](https://github.com/Vineel21/TalentSyncAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Vineel21/TalentSyncAI/actions/workflows/ci.yml)

TalentSync AI is a full-stack recruitment platform that connects candidates and recruiters through structured profiles, job discovery, application tracking, hiring analytics, and AI-assisted review.

The MVP focuses on two expensive parts of recruiting:

- Candidates should not have to re-enter information already present in their resume.
- Recruiters should not have to manually organize every applicant before identifying relevant evidence.

TalentSync turns a resume or manually entered profile into a reusable candidate record, provides explainable job-match information, and gives recruiters one pipeline for jobs, applicants, AI summaries, status changes, and analytics. AI output is decision support only; people remain responsible for employment decisions.

> **Assessment deployment:** this repository defaults to a privacy-safe assessment mode. The free Gemini project is not used for live resume or candidate-data processing. Manual onboarding and all non-AI product flows remain available, while the seeded accounts expose synthetic resume and AI fixtures for evaluation.

## Product capabilities

### Candidate workspace

- Supabase email/password registration, login, protected routes, and refresh-session recovery
- Registration-triggered three-step onboarding with persisted progress
- Resume-assisted or manual profile creation
- Editable personal details, summary, skills, experience, education, and certifications
- Profile-based job recommendations with a non-blocking Skip path
- Responsive job search, filtering, pagination, details, and saved jobs
- Job-match evidence, applications, withdrawals, current application status, and notifications
- Candidate dashboard with profile completion, saved jobs, and recent applications

### Recruiter workspace

- Role-protected recruiter registration and login
- Job creation, editing, publication, closure, and soft deletion
- Job-specific and cross-job applicant review
- Candidate profile and submitted-resume access scoped to recruiter-owned jobs
- Seeded or live-mode AI match scores, candidate summaries, and structured resume feedback
- Controlled pipeline transitions from application through offer, rejection, or withdrawal
- Dashboard metrics, monthly applicant activity, notifications, and responsive analytics

### Responsive experience

Public, authentication, onboarding, candidate, and recruiter screens use responsive navigation and adaptive layouts from narrow mobile screens through wide desktops. Tables, charts, forms, modals, drawers, cards, and action groups are constrained to avoid page-level horizontal overflow.

## Business value

| User | Problem | TalentSync outcome |
| --- | --- | --- |
| Candidate | Repeated profile entry and unclear application progress | Reusable profile, guided onboarding, job matching, saved jobs, and status tracking |
| Recruiter | Fragmented applicant review and slow resume triage | Central job pipeline, structured candidate evidence, AI-assisted summaries, and analytics |
| Hiring team | Inconsistent screening context | Validated data contracts, persisted application snapshots, controlled statuses, and human-review guidance |

## Architecture

```text
[Vercel: React 19 + Vite + TypeScript SPA]
                    |
                    | HTTPS /api/v1
                    v
[Render: Express 5 + TypeScript REST API]
 Routes -> validation -> controllers -> services -> repositories
                    |
                    +--> [Supabase: Auth + PostgreSQL/RLS + private Storage]
                    |
                    `--> [Google Gemini: backend only; disabled in assessment mode]
```

The browser never receives the Supabase service-role key or Gemini key and does not query Supabase directly. Express validates and authorizes requests before repositories access Supabase. Repository calls use the caller's JWT wherever ownership policies should apply, leaving PostgreSQL row-level security as the final authorization boundary.

### Feature-based repository structure

```text
.
|-- .github/workflows/       # CI and production delivery workflows
|-- backend/
|   |-- src/modules/         # Feature modules: controller/service/repository/routes
|   |-- src/scripts/         # Guarded demo seeding and data reset
|   |-- tests/               # API, service, repository, and validation tests
|   `-- Dockerfile           # Alternative API container image
|-- frontend/
|   `-- src/
|       |-- components/ui/   # Reusable shadcn-style primitives
|       |-- features/        # Auth, jobs, onboarding, applications, shared UI
|       |-- layouts/         # Public and authenticated shells
|       |-- pages/           # Public, candidate, recruiter, and shared pages
|       |-- routes/          # Role and onboarding route guards
|       `-- services/        # Typed REST clients
|-- supabase/
|   |-- migrations/          # Authoritative, versioned database definition
|   `-- seed.sql             # Optional local job seed
|-- render.yaml              # Render Blueprint for the API
`-- vercel.json              # Vercel SPA build and API proxy configuration
```

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, shadcn-style components |
| Routing and data | React Router, TanStack Query, Axios |
| Forms and validation | React Hook Form, Zod |
| UI | Framer Motion, Recharts, Lucide |
| Backend | Node.js 22+, Express 5, TypeScript |
| API hardening | Helmet, CORS, rate limiting, compression, Morgan, Zod |
| Upload and parsing | Multer, `pdf-parse`, private Supabase Storage |
| Database and Auth | Supabase PostgreSQL, Row Level Security, Supabase Auth |
| AI | Google Gemini through `@google/genai`, backend only |
| Testing | Vitest, Testing Library, Supertest |
| Delivery | GitHub Actions, Vercel, Render, Supabase migrations |

Dependencies are pinned in `package-lock.json`.

## Demo accounts

All accounts below use synthetic `.test` addresses and generated demo data. They are intended only for technical evaluation.

**Shared test-only password:** `TalentSyncDemo!2026#Login`

### Recruiters

| Persona | Company | Email |
| --- | --- | --- |
| Maya Nair | NovaStack Labs | `maya.recruiter@talentsync.test` |
| Arjun Rao | FinEdge Analytics | `arjun.recruiter@talentsync.test` |
| Priya Menon | CareGrid Health | `priya.recruiter@talentsync.test` |

### Candidates

| Persona | Profile | Email |
| --- | --- | --- |
| Aarav Sharma | Frontend fresher / 2026 graduate | `aarav.fresher@talentsync.test` |
| Meera Iyer | Senior backend engineer | `meera.backend@talentsync.test` |
| Rohan Gupta | Data analyst | `rohan.data@talentsync.test` |
| Sana Khan | Product designer | `sana.design@talentsync.test` |
| Vikram Singh | Senior DevOps / SRE engineer | `vikram.cloud@talentsync.test` |
| Nisha Patel | QA automation career switcher | `nisha.qa@talentsync.test` |
| Kavya Reddy | Healthcare product analyst | `kavya.health@talentsync.test` |

The fixtures include nine jobs, multiple resume versions, 22 applications, every application status, varied AI-analysis states, notifications, and recruiter analytics. The seeder marks its Auth identities in protected app metadata and refuses to overwrite an unmarked account using a reserved email.

## Local development

### Requirements

- Node.js 22 or newer
- npm 10 or newer
- A Supabase project, or the Supabase CLI and Docker for a local stack
- A Gemini API key only when deliberately testing live AI with an eligible paid project

### 1. Install dependencies

Run commands from the repository root:

```bash
npm ci
```

### 2. Create local environment files

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

### 3. Configure the backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | API port; defaults to `4000` |
| `FRONTEND_URL` | Yes | Allowed browser origin; accepts a comma-separated list |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable or legacy anon key used by the API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Backend-only maintenance and privileged operations |
| `SUPABASE_RESUME_BUCKET` | No | Private bucket; defaults to `resume-files` |
| `AI_PROCESSING_MODE` | No | `assessment` by default; use `live` only with paid Gemini eligibility |
| `GEMINI_API_KEY` | Live AI only | Backend-only Gemini key |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.6-flash` |
| `GEMINI_SERVICE_TIER` | No | `unpaid` or `paid`; `live` mode requires `paid` |
| `GEMINI_TIMEOUT_MS` | No | Total provider-operation budget; defaults to `30000` |
| `COOKIE_DOMAIN` | No | Optional production refresh-cookie domain |
| `TRUST_PROXY` | No | Express proxy-hop setting; defaults to `1` |
| `LOG_FORMAT` | No | Morgan format; defaults to `dev` |

Assessment-mode example:

```dotenv
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_RESUME_BUCKET=resume-files
AI_PROCESSING_MODE=assessment
GEMINI_SERVICE_TIER=unpaid
GEMINI_MODEL=gemini-3.6-flash
GEMINI_TIMEOUT_MS=30000
TRUST_PROXY=1
LOG_FORMAT=dev
```

Never commit `.env` files or expose the service-role and Gemini keys to the frontend.

### 4. Configure the frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | API base URL; defaults to same-origin `/api/v1` |
| `VITE_AI_PROCESSING_MODE` | No | Mirrors the backend mode so the assessment UI can explain disabled AI actions |

The default same-origin path is proxied to the local API by Vite:

```dotenv
VITE_API_URL=/api/v1
VITE_AI_PROCESSING_MODE=assessment
```

### 5. Apply the database

For a local Supabase stack:

```bash
npx supabase start
npx supabase db reset --local
```

For a linked hosted development project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not edit an already-applied migration. Add a new migration for every schema change.

### 6. Start the applications

Use separate terminals from the repository root:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

- Frontend: `http://localhost:5173`
- API health check: `http://localhost:4000/api/v1/health`

## Database, migrations, and test data

The SQL migration history is authoritative. The eight application tables are:

- `users`
- `profiles`
- `jobs`
- `applications`
- `resume_analyses`
- `ai_analyses`
- `notifications`
- `saved_jobs`

| Migration | Responsibility |
| --- | --- |
| `20260727074835_initial_talentsync_schema.sql` | Core tables, enums, indexes, functions, triggers, grants, RLS, and private resume bucket |
| `20260727114928_add_gemini_consent_receipt.sql` | Historical nullable consent-receipt columns; new uploads do not populate them |
| `20260727181809_consolidate_permissive_policies.sql` | Consolidated ownership policies |
| `20260727181844_add_candidate_onboarding_and_saved_jobs.sql` | Persisted onboarding state and candidate-owned bookmarks |
| `20260727183057_harden_candidate_onboarding_readiness.sql` | Onboarding constraints, grants, policies, and supporting indexes |

Every public application table has RLS enabled. The `resume-files` bucket is private, PDF-only at the API boundary, limited to 5 MiB, and accessed through authorized API routes.

### Seed the complete synthetic demo

The known password in this README is applied only when explicitly supplied:

```powershell
$env:DEMO_SEED_PASSWORD='TalentSyncDemo!2026#Login'
npm run seed:demo --workspace backend -- --apply
Remove-Item Env:DEMO_SEED_PASSWORD
```

Without `DEMO_SEED_PASSWORD`, the script generates strong credentials and prints them only after login and fixture verification succeeds.

### Reset application data

The guarded reset removes application rows, Auth identities, and resume objects while preserving tables, migrations, policies, functions, triggers, and bucket definitions. It refuses to run with `NODE_ENV=production`.

Preview the exact target and row counts without modifying data:

```powershell
npm run reset:data --workspace backend
```

For an intentional remote development/test reset:

```powershell
$env:DATA_RESET_ALLOWED_PROJECT_REF='<project-ref>'
npm run reset:data --workspace backend -- --apply --allow-remote --confirm=RESET_ALL_DATA_<project-ref>
Remove-Item Env:DATA_RESET_ALLOWED_PROJECT_REF
```

This operation is destructive. Stop the API and prevent new registrations first. Do not use it against a production project.

## REST API overview

All endpoints are versioned under `/api/v1`. Request bodies, path parameters, and query strings are validated with Zod where applicable.

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

Errors retain the same top-level contract:

```json
{
  "success": false,
  "message": "Human-readable error",
  "data": {
    "code": "STABLE_ERROR_CODE",
    "errors": []
  }
}
```

| Group | Key operations |
| --- | --- |
| `GET /health` | Public API health check |
| `/auth` | Register, login, refresh, logout, current user |
| `/profile` | Candidate-owned profile and recruiter-authorized applicant profile |
| `/onboarding` | Progress, recommendations, completion |
| `/resume` | Candidate upload/parse and authorized private download |
| `/jobs` | Public discovery and recruiter-owned job lifecycle |
| `/saved-jobs` | Candidate bookmark list, save, and remove |
| `/applications` | Apply, role-aware lists/details, status transition, withdrawal |
| `/ai` | Match score, recruiter summary, recruiter resume feedback |
| `/dashboard` | Candidate or recruiter dashboard selected by trusted role |
| `/notifications` | List, mark read, mark all read, and delete |

Access tokens are sent as bearer tokens. Refresh tokens remain in secure HTTP-only cookies and are not exposed to application JavaScript.

## Free Gemini assessment mode

The assessment deployment deliberately separates the working product from unsafe use of a free AI service:

| Mode | Configuration | Behavior |
| --- | --- | --- |
| Assessment | `AI_PROCESSING_MODE=assessment`, `GEMINI_SERVICE_TIER=unpaid` | Live candidate-data AI and resume upload/parse calls fail closed with `503 AI_ASSESSMENT_MODE`; manual onboarding, deterministic job recommendations, and seeded synthetic AI results remain usable |
| Live | `AI_PROCESSING_MODE=live`, `GEMINI_SERVICE_TIER=paid`, valid `GEMINI_API_KEY` | Enables backend-only Gemini workflows after the operator verifies active billing and appropriate data terms |

The flag is a safety gate, not proof of billing. Do not set `GEMINI_SERVICE_TIER=paid` unless the Gemini project is actually billing-enabled. Google instructs developers not to submit personal, sensitive, or confidential information to unpaid services in the [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms). Live AI uses bounded input, schema-validated structured output, a shared timeout budget, bounded retries, and `store: false`.

## Testing and quality gates

Run the same application checks used by CI:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Or run the combined gate:

```bash
npm run check
```

The pre-deployment audit verified the frontend and backend test suites, linting, type checking, production builds, repository formatting, `git diff --check`, and responsive browser layouts at 360, 390, 768, 1024, 1280, and 1920 pixel widths.

The CI database job also starts local Supabase and rebuilds the schema from the committed migrations.

## CI/CD and deployment

### Pipeline

Pushes to `main` and pull requests run `.github/workflows/ci.yml`:

1. Install pinned dependencies with Node.js 22.
2. Check formatting.
3. Run ESLint.
4. Type-check frontend, backend, and tests.
5. Run Vitest suites.
6. Build both production applications.
7. Start local Supabase and rebuild the database from migrations.

Production delivery runs only after the required CI workflow succeeds:

- Render reads `render.yaml`, builds the backend, checks `/api/v1/health`, and deploys after passing GitHub checks.
- `.github/workflows/deploy-production.yml` checks out the exact successful `main` revision, builds it with Vercel CLI, and deploys the prebuilt artifact.
- The same workflow also exposes a manual retry trigger for credential rotation or provider recovery.
- Vercel proxies `/api/*` to the Render service so the browser can use one public origin.
- The deployment job smoke-checks the frontend and retries the proxied API health endpoint to accommodate a free Render cold start.

### Render API

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Vineel21/TalentSyncAI)

The Blueprint uses the free Render web-service plan for assessment hosting. Free services can spin down while idle, so the first API request after inactivity may take longer than normal.

Configure these backend values in Render:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL=https://talentsync-ai-chi.vercel.app`
- `AI_PROCESSING_MODE=assessment`
- `GEMINI_SERVICE_TIER=unpaid`

No Gemini key is needed in assessment mode. The Vercel domain above is the reserved production origin; it should not be presented as a verified live application until the production pipeline and smoke check succeed.

### Vercel frontend

Import `Vineel21/TalentSyncAI` into Vercel or allow the production GitHub Actions workflow to create the deployment from the repository root. `vercel.json` owns the workspace install, frontend build, output directory, SPA fallback, and backend proxy.

Vercel's automatic Git deployment is disabled in `vercel.json` to avoid bypassing or duplicating the GitHub Actions release.

Configure:

- Vercel project environment variable `BACKEND_URL` - the verified Render service origin, without `/api/v1`
- GitHub Actions secret `VERCEL_TOKEN`
- GitHub Actions secret `VERCEL_ORG_ID`
- GitHub Actions secret `VERCEL_PROJECT_ID`

The deployment workflow uses Vercel's prebuilt production flow; provider credentials are stored in GitHub or the deployment provider, never in source control.

### Supabase production settings

1. Apply all committed migrations to the target project.
2. Keep `resume-files` private.
3. Set the Supabase Auth site URL to the verified Vercel origin.
4. Add the Vercel origin to allowed redirect URLs.
5. Enable leaked-password protection before accepting non-demo users.
6. Run Supabase security and performance advisors after migration changes.

### Recommended deployment order

1. Push the reviewed `main` branch and confirm CI is green.
2. Apply the Supabase migrations and seed only the marked synthetic demo accounts.
3. Create the Render service and verify `/api/v1/health`.
4. Set `FRONTEND_URL` in Render.
5. Configure `BACKEND_URL` and the three Vercel GitHub secrets.
6. Run the production deployment workflow.
7. Add the verified Vercel URL to Supabase Auth.
8. Smoke-test both candidate and recruiter accounts, including authorization boundaries.

Live URLs should be added to this README only after both deployments and the production smoke test succeed.

## Security model

- Supabase Auth validates identities; trusted roles are stored in `public.users`.
- Candidate/recruiter authorization is enforced by API middleware and PostgreSQL RLS.
- Every public application table has RLS and explicit Data API grants.
- Service-role and Gemini credentials are backend-only.
- Refresh sessions use secure HTTP-only cookies; access tokens remain short-lived bearer tokens.
- Helmet, strict origin-based CORS, rate limits, request-size limits, and centralized errors protect the API boundary.
- Input and AI output are validated with Zod.
- Resume files are checked for PDF MIME type, signature, trailer, count, and 5 MiB maximum size.
- Stored resumes are private and downloads are candidate- or application-scoped.
- Applications retain the submitted resume path so later profile uploads cannot silently change historical evidence.
- AI input is bounded and treated as untrusted data; AI results must receive human review.
- Secrets, local environment files, and generated deployment metadata are excluded from Git.

Before accepting real users, publish jurisdiction-appropriate Privacy and Terms pages, enable Supabase leaked-password protection, remove or isolate demo data, and perform final production authorization tests.

## Known MVP limitations

- The public assessment deployment disables live AI processing because the Gemini project uses the free tier.
- Resume-assisted onboarding and applications are demonstrated with seeded synthetic profiles. New users can complete manual onboarding, browse, and save jobs, but cannot upload the resume required for a new application while assessment mode is active.
- Application records store the current status, not an immutable status-event timeline.
- Candidate dashboard recommendations show recent eligible jobs; the separately ranked onboarding result is not persisted.
- Recruiter analytics show current pipeline totals and application-created monthly cohorts, not historical stage-conversion events.
- Password reset, social login, transactional email, interview scheduling, company pages, administrator tools, and background AI queues are post-MVP.
- Privacy and Terms pages, browser E2E automation, tracing, production alerting, and a production accessibility audit remain release work.
- Render's free service may have cold-start latency.

## Technical-assessment mapping

| Assessment requirement | Evidence |
| --- | --- |
| Build an AI-enabled application with business value | Candidate/recruiter job-board MVP with progressive onboarding, structured hiring workflows, analytics, and guarded Gemini integration |
| Push code to Git | Public GitHub repository: `Vineel21/TalentSyncAI` |
| Write CI/CD using AI | GitHub Actions validates code and migrations, then delivers the frontend after CI; Render deploys the API after checks pass |
| Deploy using CI/CD | Vercel frontend, Render API, and Supabase data services are defined as repeatable deployment configuration |
| Write documentation using AI | This README documents the product, architecture, setup, API, data, security, testing, demo access, and delivery process |

## AI-assisted development disclosure

This assessment was developed with AI assistance for requirements analysis, scaffolding, implementation, test generation, debugging, responsive review, security review, and documentation. The generated work was reviewed against the repository's architectural rules and verified with linting, type checking, automated tests, production builds, migration checks, and browser measurements.

Google Gemini is also a runtime integration, but the public assessment deployment does not send candidate data to the free service. Seeded AI records are deterministic synthetic fixtures. A human remains accountable for code acceptance, deployment credentials, production configuration, and every hiring decision.
