# Database Specification

Database Provider

Supabase PostgreSQL

The versioned SQL files in `supabase/migrations/` are the authoritative schema.
This document summarizes the application-facing shape and intentionally omits
some checks, helper functions, triggers, and indexes.

---

# Database Naming Convention

- snake_case
- UUID primary keys
- timestamptz timestamps
- Soft delete only for jobs
- Foreign keys enforced

---

# Tables

## users

Purpose

Stores authenticated users.

Fields

id UUID PK

email VARCHAR UNIQUE

role ENUM(candidate,recruiter)

created_at TIMESTAMP

updated_at TIMESTAMP

Authentication is handled by Supabase Auth.

---

## profiles

Purpose

Stores candidate profile.

Fields

id UUID PK

user_id UUID FK users.id

full_name TEXT

phone TEXT

headline TEXT

location TEXT

linkedin_url TEXT

github_url TEXT

portfolio_url TEXT

summary TEXT

skills JSONB

education JSONB

experience JSONB

certifications JSONB

resume_path TEXT

profile_completion INTEGER

onboarding_step SMALLINT (1, 2, or 3; defaults to 1)

onboarding_source TEXT (resume, manual, or null)

onboarding_completed_at TIMESTAMPTZ

recommendations_skipped_at TIMESTAMPTZ

created_at TIMESTAMP

updated_at TIMESTAMP

New profiles begin at onboarding step 1. Profiles that existed before the
progressive-onboarding migration are backfilled to step 3 with a completion
timestamp so established users are not redirected into the wizard.

---

## jobs

Purpose

Recruiter job postings.

Fields

id UUID PK

recruiter_id UUID FK users.id

title TEXT

company_name TEXT

location TEXT

employment_type TEXT

salary_min INTEGER

salary_max INTEGER

description TEXT

requirements TEXT

required_skills JSONB

status ENUM(open,closed,draft)

expires_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

---

## applications

Purpose

Candidate applications.

Fields

id UUID PK

job_id UUID FK jobs.id

candidate_id UUID FK users.id

resume_path TEXT

cover_letter TEXT

status ENUM(

Applied,

Under Review,

Shortlisted,

Interview,

Rejected,

Offer,

Withdrawn

)

ai_match_score INTEGER

created_at TIMESTAMP

updated_at TIMESTAMP

---

## resume_analyses

Purpose

Stores private resume parsing state and structured extraction snapshots.

Fields

id UUID PK

user_id UUID FK users.id

storage_path TEXT

original_filename TEXT

status ENUM(pending,processing,completed,failed)

extracted_text TEXT

parsed_data JSONB

summary TEXT

skills JSONB

education JSONB

experience JSONB

certifications JSONB

model TEXT

error_message TEXT

completed_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

Legacy nullable `gemini_consent_version` and `gemini_consented_at` columns may
exist on deployed databases. New uploads do not populate or require them.

---

## ai_analyses

Purpose

Stores AI outputs.

Fields

id UUID PK

application_id UUID

status ENUM(pending,processing,completed,failed)

match_score INTEGER

candidate_summary TEXT

resume_feedback JSONB

matching_skills JSONB

missing_skills JSONB

recommendations JSONB

model TEXT

error_message TEXT

completed_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

---

## notifications

Fields

id UUID

user_id UUID

kind ENUM(application_received,application_status_changed,system)

application_id UUID

title TEXT

message TEXT

is_read BOOLEAN

read_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP

---

## saved_jobs

Purpose

Stores candidate-owned job bookmarks used by job discovery, onboarding, and
the candidate dashboard.

Fields

candidate_id UUID FK profiles.user_id

job_id UUID FK jobs.id

created_at TIMESTAMPTZ

Primary key

(candidate_id, job_id)

The composite primary key prevents duplicate bookmarks. Saves are idempotent at
the API layer, and only currently candidate-visible jobs that accept
applications can be inserted. If a saved job later closes or expires it remains
visible to its owner so the bookmark can be reviewed or removed; soft-deleted
jobs remain hidden.

---

# Relationships

users

↓

profiles

1 : 1

users

↓

jobs

1 : many

jobs

↓

applications

1 : many

users

↓

applications

1 : many

applications

↓

ai_analyses

1 : 1

users

â†“

resume_analyses

1 : many

users

↓

saved_jobs

1 : many

jobs

↓

saved_jobs

1 : many

---

# Storage Buckets

resume-files

private

Allowed

PDF

Maximum

5 MB

Future

company-logos

profile-images

---

# Indexes

jobs(title)

jobs(location)

applications(candidate_id)

applications(job_id)

profiles(user_id)

saved_jobs(candidate_id, job_id) primary key

saved_jobs(candidate_id, created_at desc)

saved_jobs(job_id)

---

# Row Level Security

Profiles

Candidate

Can update own profile

Recruiter

Cannot update candidate profile

Jobs

Recruiter

Own jobs only

Candidate

Read only

Applications

Candidate

Own applications

Recruiter

Applications to own jobs only

Saved Jobs

Candidate

Can list, insert, and delete only rows whose `candidate_id` matches the
authenticated user. Inserts additionally require the job to be open,
unexpired, non-deleted, and accepting applications.

Recruiter

No saved-job access

The `saved_jobs` table has RLS enabled and explicit Data API grants. It is
immutable after insertion; there is intentionally no UPDATE privilege.

---

# Seed Data

Authentication identities are not seeded. If a trusted recruiter account
already exists, the seed adds the example jobs below for that recruiter.

Jobs

Frontend Developer

Backend Developer

Full Stack Developer

UI UX Designer

Cloud Engineer
