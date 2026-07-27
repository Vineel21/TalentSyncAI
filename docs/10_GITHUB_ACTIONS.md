# GitHub Actions

The workflow in `.github/workflows/ci.yml` runs for pull requests and pushes to `main`.

## Application job

1. Check out the repository.
2. Install Node.js 22 with npm caching.
3. Run `npm ci` from the workspace lockfile.
4. Check formatting.
5. Run ESLint.
6. Type-check frontend, backend, and tests.
7. Run Vitest unit and integration tests.
8. Build both production applications.

## Database job

1. Install the pinned Supabase CLI.
2. Start the local Supabase stack.
3. Rebuild the database from migrations and seed data.
4. Stop the stack even when verification fails.

This catches invalid SQL, migration ordering errors, RLS creation errors, and drift between a clean database and the committed schema.

## Deployment

Production deployment configuration is committed separately:

- `vercel.json` for the frontend
- `render.yaml` and `backend/Dockerfile` for the API

Render can be configured to auto-deploy only after GitHub checks pass. Vercel should also require successful checks for production promotion.

Runtime credentials belong in the deployment provider, not GitHub or the repository:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-3.6-flash`)
- `GEMINI_SERVICE_TIER` (`paid` in production)
- `GEMINI_TIMEOUT_MS` (default: `30000`)
- `FRONTEND_URL`
- `VITE_API_URL`

`GEMINI_API_KEY` must remain backend-only. Production requires a billing-enabled Gemini API project and `GEMINI_SERVICE_TIER=paid`; unpaid access is limited to synthetic development checks containing no personal or confidential data.
