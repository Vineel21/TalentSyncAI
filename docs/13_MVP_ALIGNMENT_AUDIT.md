# MVP Requirements Alignment Audit

Audit date: 2026-07-27

## Verdict

**The candidate/recruiter core MVP is feature-complete in the repository.
Production launch is not complete.**

The implemented product covers the MVP path defined in
[`01_PROJECT.md`](01_PROJECT.md): authentication, resume upload and backend AI
parsing, candidate profiles, job discovery and management, applications,
recruiter review, current pipeline tracking, dashboard statistics,
notifications, CI configuration, and deployment configuration. The remaining
work is hosted-database alignment, production configuration/deployment, and
end-to-end production verification.

This audit treats the versioned migrations and executable code as authoritative.
It covers the requirement groups in [`README.md`](../README.md),
[`AGENTS.md`](../AGENTS.md), [`Rules.md`](../Rules.md), and
[`01_PROJECT.md`](01_PROJECT.md) through [`12_SECURITY.md`](12_SECURITY.md).

## Aligned requirements

| Area | Alignment | Evidence |
| --- | --- | --- |
| Product journeys | Candidate registration, resume-to-profile, job browsing, match assessment, application, and current-status tracking are present. Recruiters can create/publish jobs, review applicants, generate AI analysis, and move applicants through controlled stages. | [`frontend/src/routes/app-router.tsx`](../frontend/src/routes/app-router.tsx), [`backend/src/modules/applications/service.ts`](../backend/src/modules/applications/service.ts) |
| Required frontend stack | React 19, Vite, TypeScript, Tailwind CSS, local shadcn-style UI primitives, React Router, TanStack Query, React Hook Form, Zod, Axios, Framer Motion, and Recharts are installed and used. Components are functional, and there is no Redux or browser Supabase client. | [`frontend/package.json`](../frontend/package.json), [`frontend/src/components/ui`](../frontend/src/components/ui), [`frontend/src/lib/api-client.ts`](../frontend/src/lib/api-client.ts) |
| Frontend states and layouts | Data-driven pages provide loading, error, empty, and success rendering where each state is applicable. Public, candidate, and recruiter layouts, protected routes, responsive navigation, mobile bottom navigation, reusable state views, toasts, and dark mode are implemented. | [`frontend/src/layouts/app-shell.tsx`](../frontend/src/layouts/app-shell.tsx), [`frontend/src/components/ui/state-view.tsx`](../frontend/src/components/ui/state-view.tsx), [`frontend/src/features/shared/theme-provider.tsx`](../frontend/src/features/shared/theme-provider.tsx) |
| Required backend stack | Node.js, Express, TypeScript, Zod, Multer, Helmet, Morgan, dotenv, compression, CORS, and rate limiting are configured. Business features use controller/service/repository/route/validation/type layers under `backend/src/modules`. | [`backend/package.json`](../backend/package.json), [`backend/src/app.ts`](../backend/src/app.ts), [`backend/src/modules`](../backend/src/modules) |
| Backend boundaries | Controllers delegate to services, services implement business rules, and repositories own Supabase access. The health endpoint is the deliberate infrastructure-only exception because it has no request data, business operation, or repository access. | [`backend/src/modules/jobs`](../backend/src/modules/jobs), [`backend/src/modules/resumes`](../backend/src/modules/resumes), [`backend/src/app.ts`](../backend/src/app.ts) |
| Authentication and authorization | Supabase email/password Auth, bearer JWT validation, rotating HTTP-only refresh cookies, protected routes, and candidate/recruiter role checks exist at both API and database boundaries. Runtime authorization uses the trusted `public.users.role`, not mutable user metadata. | [`backend/src/modules/auth`](../backend/src/modules/auth), [`backend/src/middleware/auth.ts`](../backend/src/middleware/auth.ts), [`frontend/src/routes/protected-route.tsx`](../frontend/src/routes/protected-route.tsx) |
| REST API | Feature routes are versioned under `/api/v1`, validate relevant body/path/query input with Zod, handle errors centrally, and return typed `{ success, message, data }` envelopes. The route inventory in `04_API.md` aligns with the implemented feature routers. | [`backend/src/app.ts`](../backend/src/app.ts), [`backend/src/middleware/validation.ts`](../backend/src/middleware/validation.ts), [`backend/src/shared/api-response.ts`](../backend/src/shared/api-response.ts), [`04_API.md`](04_API.md) |
| Database and Storage | The schema uses UUIDs, snake case, foreign keys, timestamptz values, job soft deletion, private resume storage, explicit grants, indexes, checks, triggers, and RLS on every public application table. Candidate resumes are immutable path snapshots on applications. | [`supabase/migrations/20260727074835_initial_talentsync_schema.sql`](../supabase/migrations/20260727074835_initial_talentsync_schema.sql), [`backend/src/modules/applications/service.ts`](../backend/src/modules/applications/service.ts) |
| Jobs and applications | Public discovery supports search, location, skills, salary, employment type, status, and pagination. Recruiters own job lifecycle operations. Candidates can apply once with a resume snapshot and withdraw; recruiters use constrained status transitions. | [`backend/src/modules/jobs`](../backend/src/modules/jobs), [`frontend/src/pages/candidate/jobs-page.tsx`](../frontend/src/pages/candidate/jobs-page.tsx), [`backend/src/modules/applications/service.ts`](../backend/src/modules/applications/service.ts) |
| AI workflows | Gemini runs only in the backend with `gemini-3.6-flash`, bounded input, structured output, Zod validation, one operation timeout budget, bounded retries, `store: false`, paid-tier enforcement for real candidate data, and normalized provider errors. Resume parsing, candidate job matching, recruiter summaries, and recruiter resume feedback are implemented. | [`backend/src/modules/ai/service.ts`](../backend/src/modules/ai/service.ts), [`backend/src/config/env.ts`](../backend/src/config/env.ts), [`backend/src/modules/ai/routes.ts`](../backend/src/modules/ai/routes.ts), [`frontend/src/features/applications/resume-feedback-panel.tsx`](../frontend/src/features/applications/resume-feedback-panel.tsx) |
| Notifications | In-app application and status notifications, listing, read-one/read-many/read-all, deletion, pagination, empty states, and ownership policies are implemented. | [`backend/src/modules/notifications`](../backend/src/modules/notifications), [`frontend/src/pages/shared/notifications-page.tsx`](../frontend/src/pages/shared/notifications-page.tsx) |
| CI and release configuration | The repository has pinned dependencies, lint/type/test/build scripts, GitHub Actions application checks, a clean local migration rebuild job, Vercel SPA configuration, Render configuration, and a backend Dockerfile. These are release assets, not evidence that production is already live. | [`package-lock.json`](../package-lock.json), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`vercel.json`](../vercel.json), [`render.yaml`](../render.yaml), [`backend/Dockerfile`](../backend/Dockerfile) |

## Partial or mismatched requirements

| Documented claim | Current implementation and decision |
| --- | --- |
| `Administrator` is named as a primary user in [`01_PROJECT.md`](01_PROJECT.md). | There is no administrator role, route, schema enum value, or UI. The actual authorization contract intentionally contains only candidate and recruiter roles in [`backend/src/modules/auth/validation.ts`](../backend/src/modules/auth/validation.ts) and the initial migration. Administration is not in the documented MVP scope, so this is a broad-vision item rather than an incomplete MVP journey. |
| Candidate resume “feedback” was previously described as a candidate feature. | Corrected boundary: candidates receive structured parsing/profile extraction and an explainable job-match assessment. Structured ATS/grammar/skills/projects/formatting/achievements feedback is application-scoped and recruiter-only, enforced in [`backend/src/modules/ai/routes.ts`](../backend/src/modules/ai/routes.ts) and rendered in the recruiter applicant experience. |
| Application “status history” can imply an event timeline. | Applications store one current `status` plus timestamps, with transition rules in [`backend/src/modules/applications/service.ts`](../backend/src/modules/applications/service.ts). Notifications are user-deletable and are not an immutable audit log. The product tracks the latest state and a list of past applications; it does not provide a status-event timeline. |
| Candidate dashboard “Recommended Jobs” implies personalization. | [`backend/src/modules/dashboard/repository.ts`](../backend/src/modules/dashboard/repository.ts) currently selects the newest eligible open jobs ordered by `created_at`; it does not rank against the candidate profile. The UI label in [`frontend/src/pages/candidate/candidate-dashboard-page.tsx`](../frontend/src/pages/candidate/candidate-dashboard-page.tsx) is therefore aspirational. Personalized recommendations remain future work. |
| Recruiter analytics imply historical analysis. | Current backend analytics are aggregate pipeline counts and recent records. The optional frontend time-series panels in [`frontend/src/pages/recruiter/analytics-page.tsx`](../frontend/src/pages/recruiter/analytics-page.tsx) have no backend historical series, so they show an empty state. Aggregate statistics satisfy the MVP dashboard requirement; cohort, conversion-over-time, and historical trend analytics do not exist yet. |
| The frontend specifications include Settings, a profile image, candidate AI Suggestions, recruiter AI Insights, trusted companies, testimonials, and every job-card action. | Settings routes and profile-image storage/UI are absent. The landing page has hero, features, how-it-works, latest jobs, CTA, and footer, but not trusted-company or testimonial sections. AI is available in job matching and recruiter applicant review, but there is no separate insights center. Job application and match actions live on job details rather than entirely on each card. These are partial presentation requirements, not blockers for the core workflows. Evidence: [`frontend/src/pages/public/landing-page.tsx`](../frontend/src/pages/public/landing-page.tsx), [`frontend/src/layouts/app-shell.tsx`](../frontend/src/layouts/app-shell.tsx), and [`frontend/src/features/jobs/job-card.tsx`](../frontend/src/features/jobs/job-card.tsx). |
| [`06_FRONTEND.md`](06_FRONTEND.md) prescribes an exact broad folder list. | The implementation uses a smaller feature-oriented combination of `pages`, `features`, `services`, `layouts`, `routes`, `components`, and `lib`. The architectural and state-management rules are met; unused placeholder directories such as `store` were intentionally not created. |
| [`03_DATABASE.md`](03_DATABASE.md) is a complete schema specification. | Stale schema descriptions were found, including older `resume_url`/`ai_analysis` naming, missing resume-analysis fields, and an incomplete status list. The accompanying documentation cleanup corrects the major names, but this file remains a human-readable summary. The authoritative schema—including currency/publication/deletion fields, checks, generated search data, exact indexes, functions, grants, and policies—is the migration in [`supabase/migrations`](../supabase/migrations). |
| The API documents previously used two different error envelopes. | The documentation now consistently uses the actual `{ success: false, message, data: { code, errors } }` contract implemented in [`backend/src/middleware/error-handler.ts`](../backend/src/middleware/error-handler.ts) and tested in [`backend/tests/app.integration.test.ts`](../backend/tests/app.integration.test.ts). |
| “Every page” has every loading/error/empty/success state. | Dynamic list/detail/dashboard pages implement the relevant states. Static landing/auth/404 pages and already-loaded form screens do not manufacture meaningless empty or loading branches. This is a pragmatic interpretation of the rule rather than a functional gap. |
| Success metrics in [`01_PROJECT.md`](01_PROJECT.md) are measurable today. | The product workflows exist, but application-completion time, parsing accuracy, match-quality accuracy, and recruiter review time are not instrumented as product telemetry. Deployment success will only be measurable after release. |
| Monitoring in [`02_TECH_STACK.md`](02_TECH_STACK.md) is operational. | Render logs and Supabase Dashboard become available with hosted use, but production deployment, Vercel Analytics integration, alerting, and tracing have not been verified. |
| “Unit and integration tests” implies full external integration coverage. | The suite covers services, repositories with doubles, route authorization/validation, response envelopes, React components, and frontend services. CI also rebuilds a local database from migrations. It does not yet run a real Supabase Auth/RLS/Storage vertical test, real Gemini test, or browser E2E journey. See [`backend/tests`](../backend/tests), [`frontend/src/test`](../frontend/src/test), and [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). |

## Deliberately post-MVP or not required

- Saved jobs are shown as a Save button in [`09_UI_UX.md`](09_UI_UX.md), but
  [`README.md`](../README.md) and [`11_IMPLEMENTATION_PLAN.md`](11_IMPLEMENTATION_PLAN.md)
  explicitly place saved jobs after the MVP. This resolves the documentation
  conflict in favor of the defined product boundary.
- Company profiles/pages, company-logo storage, profile-image storage,
  password reset UI, social login, transactional email, interview scheduling
  and calendar integration, recruiter collaboration, immutable audit history,
  background AI queues, and production observability are post-MVP work.
- The recruiter `Interview` status is implemented; scheduling an interview is
  a separate post-MVP capability.
- An administrator workspace is not required for the candidate/recruiter MVP.
- Example Auth users are not seeded because Supabase Auth identities must be
  created through Auth. [`supabase/seed.sql`](../supabase/seed.sql) conditionally
  seeds jobs only when a recruiter already exists.

## Extra hardening already present

- Every public application table has RLS, and Data API privileges are explicit
  rather than relying on default grants.
- The browser communicates only with Express; the service-role and Gemini keys
  stay in the backend.
- Resume files are private, owner-prefixed, limited to 5 MiB, and checked for
  PDF MIME type, signature, trailer, and count before storage.
- Applications retain immutable resume paths so later candidate profile
  updates do not change submitted evidence.
- AI inputs are treated as untrusted delimited data, outputs are
  schema-validated, and hiring output is explicitly decision support requiring
  human review.
- Real candidate data fails closed unless the backend declares a
  billing-enabled Gemini service tier.
- Registration retains the product's 18-or-older eligibility notice.
- The per-upload Gemini consent checkbox and request/API gate have been
  removed. Resume upload retains a non-blocking processing disclosure.
  Historical nullable `gemini_consent_version` and `gemini_consented_at`
  columns from
  [`20260727114928_add_gemini_consent_receipt.sql`](../supabase/migrations/20260727114928_add_gemini_consent_receipt.sql)
  remain for old records and are not populated for new uploads. Dropping them
  would be destructive and is not needed for the MVP.
- The React Router advisory review in [`12_SECURITY.md`](12_SECURITY.md)
  documents why the reported React Server Components path is not present in
  this Vite SPA; the dependency should still be upgraded when an applicable
  patched release is available.

## Release actions still required

1. Rerun `npm ci`, formatting, lint, type checking, tests, production builds,
   and a clean local Supabase migration rebuild on the final consent-removal
   tree.
2. Apply the committed but currently pending hosted RLS consolidation migration
   [`20260727102656_consolidate_permissive_policies.sql`](../supabase/migrations/20260727102656_consolidate_permissive_policies.sql).
3. Rerun Supabase security and performance advisors after the hosted migration,
   confirm explicit Data API grants, and resolve any remaining findings.
4. Enable Supabase Auth leaked-password protection and configure the production
   site URL and allowed redirect URLs.
5. Configure Render backend secrets and URLs, including a paid Gemini project,
   and configure Vercel `VITE_API_URL`; do not copy backend secrets to the
   frontend.
6. Deploy the API and SPA, then smoke-test both complete journeys in production:
   candidate registration through application/withdrawal, and recruiter job
   creation through applicant AI review and pipeline updates.
7. Verify private resume downloads for both authorized roles and verify that
   cross-user/cross-recruiter access remains denied in the hosted environment.

Until those steps pass, the accurate release statement is:
**core MVP complete; production launch incomplete**.

## Source-by-source conclusion

| Source | Conclusion |
| --- | --- |
| [`README.md`](../README.md) | Accurately describes the core implementation and MVP boundary; deployment instructions remain to be executed. |
| [`AGENTS.md`](../AGENTS.md) | Mandatory stack, architecture, API, Auth, AI-provider, and coding rules are substantially aligned. |
| [`Rules.md`](../Rules.md) | TypeScript, API-only frontend data access, shared UI, form validation, and feature layering are aligned, with the health endpoint as the infrastructure exception. |
| [`01_PROJECT.md`](01_PROJECT.md) | Candidate/recruiter vision and MVP modules are implemented; administrator, telemetry, and production deployment are not. |
| [`02_TECH_STACK.md`](02_TECH_STACK.md) | Application stack aligns; production monitoring is partial/unverified. |
| [`03_DATABASE.md`](03_DATABASE.md) | High-level intent aligns, but it had stale schema details; migrations are authoritative. |
| [`04_API.md`](04_API.md) | Route inventory and current response envelopes align with the API. |
| [`05_SUPABASE.md`](05_SUPABASE.md) | Auth, PostgreSQL, private Storage, grants, and RLS align; hosted consolidation remains a release action. |
| [`06_FRONTEND.md`](06_FRONTEND.md) | Core routes, layouts, forms, components, and states align; aspirational widgets/sections are partial. |
| [`07_BACKEND.md`](07_BACKEND.md) | Feature architecture, middleware, upload, AI flow, and error-envelope example align. |
| [`08_AI.md`](08_AI.md) | Implemented Gemini workflows and safeguards align; resume feedback is recruiter-only and per-upload consent is removed. |
| [`09_UI_UX.md`](09_UI_UX.md) | Responsive SaaS baseline aligns; Settings, image, saved-job, testimonial, trusted-company, and distinct AI-insight items are absent or post-MVP. |
| [`10_GITHUB_ACTIONS.md`](10_GITHUB_ACTIONS.md) | CI workflow and deployment configuration files align; no production success is implied. |
| [`11_IMPLEMENTATION_PLAN.md`](11_IMPLEMENTATION_PLAN.md) | Its core-complete/release-incomplete verdict is supported by this audit. |
| [`12_SECURITY.md`](12_SECURITY.md) | Implemented controls align; hosted Auth hardening and final production authorization tests remain. |
