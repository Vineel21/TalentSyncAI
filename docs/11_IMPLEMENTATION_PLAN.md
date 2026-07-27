# MVP implementation status

## Verdict

The candidate and recruiter MVP is feature-complete in the repository.
Production launch is not complete until the hosted migration history matches
the repository, deployment environments are configured, and both role journeys
pass a production smoke test.

## Completed

- Monorepo scaffolding and shared quality configuration
- Supabase schema, indexes, grants, RLS, triggers, private storage, and seed
- Supabase Auth with candidate/recruiter role-based access
- Feature-based Express API under `/api/v1`
- Candidate and recruiter React experiences
- Resume upload, parsing, feedback, and private download
- Job discovery and recruiter job management
- Application workflow and hiring-pipeline transitions
- AI candidate summary and job-match analysis
- Dashboards, analytics, and notifications
- Unit and integration tests
- Vercel, Render, Docker, and GitHub Actions configuration

## Known alignment gaps

- `Administrator` appears in the broad product vision but is not part of the
  implemented candidate/recruiter MVP.
- Application tracking stores the current status; it does not provide an
  immutable event-history timeline.
- Candidate dashboard recommendations are currently recent eligible jobs, not
  personalized ranking.
- Recruiter analytics summarize current pipeline data rather than historical
  trends.
- Settings pages, profile images, saved jobs, and several aspirational landing
  page sections are not implemented. Saved jobs and company profiles are
  explicitly post-MVP.
- Automated tests cover services, components, API behavior, and builds, but a
  real Supabase Auth/RLS/Storage vertical test and browser E2E suite remain.

See `docs/13_MVP_ALIGNMENT_AUDIT.md` for the detailed requirements comparison.

## Release checklist

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Rebuild a clean Supabase database from migrations
- Apply migrations to the target hosted Supabase project
- Run Supabase security and performance advisors
- Publish a jurisdiction-appropriate privacy notice and terms covering the
  18+ audience, AI processing purposes, subprocessors, retention/deletion, and
  human review of employment decisions
- Verify that the production Gemini key belongs to the intended actively
  billed project and review its logging/Zero Data Retention configuration
- Configure Render and Vercel environment variables
- Configure Supabase Auth production URLs
- Smoke-test candidate and recruiter flows in production

## Post-MVP backlog

- Password-reset and social-login interfaces
- Saved jobs and company profiles
- Background queues for long-running AI work
- Transactional email delivery
- Interview scheduling and calendar integration
- Recruiter collaboration and audit history
- Accessibility and end-to-end browser automation suite
- Observability, tracing, and production alerting
