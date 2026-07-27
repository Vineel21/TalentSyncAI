# Supabase configuration

TalentSync uses Supabase Auth, PostgreSQL, and private Storage. The browser does not use a Supabase client; all access flows through the Express API.

## Project

- Hosted project reference: `ouxjdcgbeljmysfwifgd`
- Storage bucket: `resume-files`
- Bucket visibility: private
- Allowed upload: validated PDF
- Maximum file size: 5 MiB

## Schema

The initial migration creates:

- `users`
- `profiles`
- `jobs`
- `applications`
- `resume_analyses`
- `ai_analyses`
- `notifications`

It also defines enums, foreign keys, checks, indexes, update timestamps, profile-completion calculation, job publication timestamps, signup synchronization, application notifications, explicit grants, RLS policies, and private storage policies.

A follow-up migration adds `gemini_consent_version` and `gemini_consented_at` to `resume_analyses`. Only the backend service role can create or change these receipt fields; candidates and authorized recruiters can read them through the existing row-level policies.

## Authentication

Email/password authentication is supported for `candidate` and `recruiter` accounts. A signup trigger copies the requested role into the trusted `public.users` record once. Runtime authorization always reads that database role and does not trust mutable client metadata.

Configure the production frontend as the Supabase Auth site URL and add it to allowed redirect URLs. Email confirmation can be enabled in the hosted Auth settings.

## Environment variables

Backend:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_RESUME_BUCKET=resume-files
```

No Supabase key belongs in the frontend environment. `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to a browser, log, or committed file.

## Local workflow

```bash
npx supabase start
npx supabase db reset --local
```

The reset applies all files in `supabase/migrations` and then runs `supabase/seed.sql`. The seed adds example jobs only if a recruiter account already exists; it never creates an Auth identity.

## Hosted workflow

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Use a new timestamped migration for every subsequent change. Do not edit an already deployed migration.

## Security model

- RLS is enabled on every public table.
- Anonymous grants are restricted to public job discovery.
- Authenticated grants expose only the columns required by repositories.
- Policies include explicit roles and both `USING` and `WITH CHECK` where applicable.
- Ownership checks use `(select auth.uid())` to avoid per-row re-evaluation.
- Candidates retain read access to jobs referenced by their application history.
- Recruiters can read candidate data and resume objects only through applications to recruiter-owned jobs.
- Resume paths are immutable application snapshots so later candidate uploads do not change historical applications.
- Storage object names are scoped by candidate UUID and the bucket remains private.
