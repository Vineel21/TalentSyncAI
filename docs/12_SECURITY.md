# Security

## Trust boundaries

- The React application communicates only with the Express API.
- The API validates and authorizes requests before repository access.
- Supabase RLS and private Storage policies remain the final data-access boundary.
- Google Gemini and Supabase service credentials exist only in backend runtime configuration. `GEMINI_API_KEY` must never be exposed to the browser.
- Production environment validation rejects a missing `GEMINI_API_KEY` or an unpaid `GEMINI_SERVICE_TIER`.

## Implemented controls

- Supabase Auth bearer tokens and rotating HTTP-only refresh cookies
- Candidate/recruiter role checks at the API and database layers
- Explicit database grants and RLS on every public table
- Helmet, strict CORS, request-size limits, rate limits, and normalized errors
- Zod validation for request and AI output boundaries
- PDF MIME, signature, trailer, count, and 5 MiB size validation
- Private application-scoped resume downloads
- Soft deletion and database-maintained timestamps
- No committed secrets or local environment files

## AI data handling

- The configured Gemini model is `gemini-3.6-flash`.
- Candidate-data calls require a billing-enabled Gemini API project. Unpaid access is limited to synthetic development checks because Google instructs developers not to submit personal, sensitive, or confidential information to unpaid services.
- TalentSync is intended only for users who are at least 18; account registration states this eligibility requirement.
- The resume upload UI provides a non-blocking Gemini-processing disclosure. The API does not require or create a per-upload consent receipt. Existing nullable receipt fields are retained only as historical records.
- `store: false` disables Gemini Interactions API conversation-state storage, but paid-service prompts and responses may still be logged briefly for abuse monitoring unless Zero Data Retention is approved for the project.
- Minimize resume and candidate data before model calls, and use a service tier with suitable data-use terms when required.
- AI output must remain decision support; recruiters must not automatically reject, select, or otherwise materially disadvantage candidates solely from a Gemini result.

## Dependency advisory review

The release dependency scan currently reports `GHSA-qwww-vcr4-c8h2` against React Router 7. The advisory applies to React Server Components action handling. TalentSync is a Vite single-page application using `BrowserRouter`; it does not enable React Router RSC mode, framework actions, or a React Router server runtime. The affected code path is therefore not present in this deployment.

The npm-suggested downgrade is not accepted because it would reintroduce older fixed router advisories. Keep React Router pinned, monitor the upstream advisory, and upgrade to a patched current release as soon as one is published.

## Reporting

Do not open a public issue containing credentials, personal resume data, or an exploitable vulnerability. Revoke any exposed credential immediately, preserve relevant logs, and contact the repository owner privately with reproducible details.
