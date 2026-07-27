# TalentSync AI

TalentSync AI is a full-stack recruitment MVP for candidates and recruiters. Candidates can build a profile, upload and parse a PDF resume, discover jobs, receive an AI match assessment, apply, and track their application history. Recruiters can publish jobs, review applicants, generate structured AI summaries and match scores, move candidates through a hiring pipeline, and inspect recruiting analytics.

## What is included

### Candidate experience

- Email/password registration and login with Supabase Auth
- Protected, role-aware routes with refresh-cookie session recovery
- Candidate profile, skills, experience, education, and certifications
- Private PDF resume upload, download, and backend-only parsing
- Structured AI resume analysis and improvement feedback
- Public job discovery with search, filters, pagination, and job details
- AI job-match score with matching skills, missing skills, and recommendation
- Job applications with immutable resume snapshots and status history
- Dashboard, profile-completion indicator, and notifications

### Recruiter experience

- Recruiter registration and role-protected workspace
- Job creation, editing, publication, closure, and soft deletion
- Applicant list and detailed candidate profiles
- Private application resume download
- AI candidate summary, resume feedback, and persisted match analysis
- Controlled application-status transitions
- Hiring-pipeline metrics, job statistics, and notifications

## Architecture

```text
React + Vite
      |
      | HTTPS /api/v1
      v
Express + TypeScript
      |
      +-- Supabase Auth
      +-- PostgreSQL with RLS
      +-- Private Supabase Storage
      +-- Google Gemini API
```

The browser never connects to Supabase or Google Gemini directly. The Express API validates every request and passes work through controllers, services, and repositories. Repository calls use the caller's Supabase JWT so database row-level security remains the final authorization boundary.

```text
frontend/                 React application
backend/src/modules/      Feature-based Express modules
supabase/migrations/      Versioned schema, grants, RLS, triggers, and storage
supabase/seed.sql         Optional local demo jobs
docs/                     Product and technical documentation
.github/workflows/        CI quality gates
```

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- A Supabase project
- A Google Gemini API key; a billing-enabled project is required for workflows that process real candidate data
- Supabase CLI for local database development

## Local setup

1. Install the pinned workspace dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment templates:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On PowerShell, use `Copy-Item` instead of `cp`.

3. Configure `backend/.env`:

   Create a new authorization key in [Google AI Studio](https://aistudio.google.com/apikey), then set it as `GEMINI_API_KEY`. Leave `GEMINI_SERVICE_TIER=unpaid` for synthetic development checks. Before processing real candidate data, attach an active Cloud Billing account, confirm the project is marked **Paid** in AI Studio, and change the value to `paid`.

   ```dotenv
   NODE_ENV=development
   PORT=4000
   FRONTEND_URL=http://localhost:5173
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   SUPABASE_RESUME_BUCKET=resume-files
   GEMINI_API_KEY=<gemini-api-key>
   GEMINI_MODEL=gemini-3.6-flash
   GEMINI_SERVICE_TIER=unpaid
   GEMINI_TIMEOUT_MS=30000
   ```

   Keep the service-role and Gemini API keys on the backend only. The frontend requires only:

   ```dotenv
   VITE_API_URL=http://localhost:4000/api/v1
   ```

4. Apply the database locally:

   ```bash
   npx supabase start
   npx supabase db reset --local
   ```

   To deploy the migration to a linked hosted project:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

5. Run the API and frontend in separate terminals:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

   The frontend runs at `http://localhost:5173`; the API health check is `http://localhost:4000/api/v1/health`.

## Quality gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run check` runs linting, type checking, tests, and both production builds. CI also rebuilds the Supabase database from migrations.

## API conventions

All endpoints are under `/api/v1`. Successful responses use:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

Errors use the same top-level contract with `success: false`, a message, and a stable error code. Access tokens are sent as bearer tokens. Refresh tokens are stored in a secure, HTTP-only cookie and are never exposed to application JavaScript.

See [docs/04_API.md](docs/04_API.md) for the route inventory.

## Deployment

- `vercel.json` builds the React SPA and rewrites client-side routes to `index.html`.
- `render.yaml` builds and runs the Express API and checks `/api/v1/health`.
- `backend/Dockerfile` provides an alternative production image.
- `.github/workflows/ci.yml` verifies formatting, linting, types, tests, builds, and migrations.

For production:

1. Deploy the API to Render and configure all backend environment variables.
2. Set `FRONTEND_URL` to the exact Vercel origin.
3. Set `VITE_API_URL` in Vercel to the Render URL ending in `/api/v1`.
4. Add the deployed frontend origin to the Supabase Auth site URL and allowed redirect URLs.
5. Keep the `resume-files` bucket private; downloads must continue through the API.

## Security notes

- Every public table has row-level security enabled.
- Grants are explicit; new tables are not implicitly exposed.
- Recruiter/candidate roles are read from the trusted database record, not client input after signup.
- Resume files are validated as PDFs, limited to 5 MiB, stored privately, and authorized per user/application.
- AI input is handled only by the backend with structured output validation, timeouts, retries, interaction storage disabled, and data minimization.
- Candidates must confirm they are at least 18 and accept the current Gemini processing disclosure before upload; the API records that consent version against the exact resume and enforces it for later AI workflows.
- The [Gemini API terms](https://ai.google.dev/gemini-api/terms) instruct developers not to submit personal, sensitive, or confidential information to unpaid services. Candidate-data calls therefore fail closed unless `GEMINI_SERVICE_TIER=paid`, and production startup rejects unpaid configuration.
- An unpaid key may be used only for synthetic development checks that contain no real personal or confidential data.
- Secrets and local environment files are excluded from Git.

## Current MVP boundary

Email delivery, social login, saved jobs, interview scheduling, company pages, and background AI jobs are intentionally outside this MVP. The repository is structured so these can be added as feature modules without bypassing the API or RLS boundaries.
