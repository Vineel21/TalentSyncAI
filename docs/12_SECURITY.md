# Security

## Trust boundaries

- The React application communicates only with the Express API.
- The API validates and authorizes requests before repository access.
- Supabase RLS and private Storage policies remain the final data-access boundary.
- OpenAI and Supabase service credentials exist only in backend runtime configuration.

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

## Dependency advisory review

The release dependency scan currently reports `GHSA-qwww-vcr4-c8h2` against React Router 7. The advisory applies to React Server Components action handling. TalentSync is a Vite single-page application using `BrowserRouter`; it does not enable React Router RSC mode, framework actions, or a React Router server runtime. The affected code path is therefore not present in this deployment.

The npm-suggested downgrade is not accepted because it would reintroduce older fixed router advisories. Keep React Router pinned, monitor the upstream advisory, and upgrade to a patched current release as soon as one is published.

Full-tree scans also flag a transitive `minimatch`/`brace-expansion` chain under ESLint 9 peer dependencies. These packages are development-only, process repository-controlled lint globs, and are excluded from production installation and bundles. They should be upgraded when the TypeScript and React ESLint plugins support the ESLint 10 dependency graph without a nested ESLint 9 peer.

## Reporting

Do not open a public issue containing credentials, personal resume data, or an exploitable vulnerability. Revoke any exposed credential immediately, preserve relevant logs, and contact the repository owner privately with reproducible details.
