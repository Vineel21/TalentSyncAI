# Database Specification

Database Provider

Supabase PostgreSQL

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

resume_url TEXT

profile_completion INTEGER

created_at TIMESTAMP

updated_at TIMESTAMP

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

resume_url TEXT

cover_letter TEXT

status ENUM(

Applied,

Under Review,

Shortlisted,

Interview,

Rejected,

Offer

)

ai_match_score INTEGER

created_at TIMESTAMP

updated_at TIMESTAMP

---

## ai_analysis

Purpose

Stores AI outputs.

Fields

id UUID PK

application_id UUID

candidate_summary TEXT

resume_feedback TEXT

matching_skills JSONB

missing_skills JSONB

recommendations JSONB

created_at TIMESTAMP

---

## notifications

Fields

id UUID

user_id UUID

title TEXT

message TEXT

is_read BOOLEAN

created_at TIMESTAMP

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

ai_analysis

1 : 1

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

---

# Seed Data

Recruiter

admin@talentsync.ai

Candidate

candidate@test.com

Jobs

Frontend Developer

Backend Developer

Full Stack Developer

UI UX Designer

Cloud Engineer
