# REST API

Base path: `/api/v1`

All request bodies, path parameters, and query strings are validated with Zod. Successful responses use `{ "success": true, "message": "...", "data": ... }`; errors use `{ "success": false, "message": "...", "data": { "code": "...", "errors": [] } }`.

## Health

- `GET /health` - public API health check

## Authentication

- `POST /auth/register` - create a candidate or recruiter account
- `POST /auth/login` - authenticate and set the refresh cookie
- `POST /auth/refresh` - rotate the refresh session and return a new access token
- `POST /auth/logout` - revoke the current session and clear the cookie
- `GET /auth/me` - return the authenticated user

The access token is returned in the response and sent as `Authorization: Bearer <token>`. The refresh token is stored only in a secure, HTTP-only cookie.

## Profile

- `GET /profile` - candidate's own profile
- `PUT /profile` - update candidate profile
- `GET /profile/:id` - recruiter access to a candidate who applied to one of their jobs

The general profile update contract does not accept onboarding control fields.
Onboarding progress is updated only through the dedicated endpoints below.

## Candidate onboarding

- `GET /onboarding` - return persisted candidate onboarding progress as
  `{ onboarding: { currentStep, source, completedAt, recommendationsSkippedAt } }`
- `PATCH /onboarding/progress` - move to or revisit a wizard step with
  `{ "step": 1 | 2 | 3, "source"?: "resume" | "manual" }`
- `POST /onboarding/recommendations` - return up to three open-job
  recommendations as `{ recommendations: [{ job, match, aiGenerated }] }`
- `POST /onboarding/complete` - finish onboarding with
  `{ "skippedRecommendations": boolean }`

Steps must be completed sequentially. Step 2 requires a resume or manual
source. Step 3 and completion require a full name, headline, location,
non-empty summary, at least one skill, and education or experience. Education
alone satisfies the final condition so freshers are supported.

Recommendation candidates are deterministically ranked from profile/job skill,
headline, and location alignment. The backend attempts Gemini match enrichment
for each shortlisted job. If a provider call fails, that job returns the
deterministic match with `aiGenerated: false`; provider availability never
blocks onboarding. Candidates can also bypass recommendation review with the
Skip action, which is recorded when onboarding completes.

## Resume

- `POST /resume/upload` - candidate PDF upload as `multipart/form-data` field `file`; maximum 5 MiB
- `POST /resume/parse` - parse the candidate's uploaded resume and persist structured analysis
- `GET /resume/download` - authorized private download; candidates use their own file, recruiters pass `applicationId`

## Jobs

- `GET /jobs` - public open-job discovery or role-aware authenticated listing
- `GET /jobs/:id` - public open-job details, recruiter-owned jobs, or candidate application history
- `POST /jobs` - recruiter creates a job
- `PUT /jobs/:id` - recruiter updates an owned job
- `PATCH /jobs/:id/status` - recruiter changes job status
- `DELETE /jobs/:id` - recruiter soft-deletes an owned job

Supported list query fields include `page`, `limit`, `search`, `location`, `skills`, `salary`, `employmentType`, and recruiter-aware `status`.

## Saved jobs

- `GET /saved-jobs` - return candidate-owned bookmarks as
  `{ savedJobs: [{ job, savedAt }] }`
- `POST /saved-jobs/:jobId` - save an open, candidate-visible job and return
  `{ savedJob: { job, savedAt } }`
- `DELETE /saved-jobs/:jobId` - remove the candidate's bookmark

`jobId` must be a UUID. Repeated saves are idempotent, and candidates cannot
newly save closed, expired, deleted, or otherwise unavailable jobs. A job that
closes or expires after being saved remains visible to its owner until removed.

## Applications

- `POST /applications` - candidate applies to an open job
- `GET /applications` - role-aware paginated list
- `GET /applications/:id` - authorized application details
- `PATCH /applications/:id/status` - recruiter updates pipeline status
- `PATCH /applications/:id/withdraw` - candidate withdraws an application
- `DELETE /applications/:id` - compatibility alias for candidate withdrawal

Application statuses are `applied`, `under_review`, `shortlisted`, `interview`, `rejected`, `offer`, and `withdrawn`.

## AI

- `POST /ai/match-score` - candidate job match by `jobId`, or recruiter persisted analysis by `applicationId`
- `POST /ai/candidate-summary` - recruiter summary by `applicationId`
- `POST /ai/resume-feedback` - authorized structured resume feedback by `applicationId`

AI calls run only in the backend and return schema-validated structured output.

## Dashboard

- `GET /dashboard` - candidate or recruiter dashboard, selected from the authenticated role

Candidate responses include profile-completion and application-status counts,
recent applications, eligible jobs, and up to three saved jobs. Recruiter
responses include current pipeline counts, recent jobs/applicants, and six
monthly application-activity cohorts.

## Notifications

- `GET /notifications` - paginated authenticated notification list
- `PATCH /notifications/read-all` - mark all notifications read
- `PATCH /notifications/read` - mark the supplied notification IDs read
- `PATCH /notifications/:id/read` - mark one notification read
- `DELETE /notifications/:id` - delete one owned notification

## Authorization summary

- Anonymous users can read only open, unexpired, non-deleted jobs.
- Candidates can manage only their profile, onboarding progress, saved jobs,
  resume, applications, and notifications.
- Recruiters can manage only their jobs and see candidates/applications attached to those jobs.
- PostgreSQL RLS enforces the same ownership rules beneath the API.
