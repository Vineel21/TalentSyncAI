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

## Notifications

- `GET /notifications` - paginated authenticated notification list
- `PATCH /notifications/read-all` - mark all notifications read
- `PATCH /notifications/read` - mark the supplied notification IDs read
- `PATCH /notifications/:id/read` - mark one notification read
- `DELETE /notifications/:id` - delete one owned notification

## Authorization summary

- Anonymous users can read only open, unexpired, non-deleted jobs.
- Candidates can manage only their profile, resume, applications, and notifications.
- Recruiters can manage only their jobs and see candidates/applications attached to those jobs.
- PostgreSQL RLS enforces the same ownership rules beneath the API.
