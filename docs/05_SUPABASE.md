# Supabase Configuration

Project Name

TalentSync AI

---

# Authentication

Email Password

Enabled

Google OAuth

Optional

GitHub OAuth

Optional

Email Verification

Enabled

Password Reset

Enabled

---

# Storage

Bucket

resume-files

Private

Allowed Files

PDF

Maximum

5 MB

---

# Environment Variables

Frontend

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

Backend

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

OPENAI_API_KEY

JWT_SECRET

PORT

---

# Security

Never expose

Service Role Key

Frontend uses

Anon Key

Backend uses

Service Role

---

# Row Level Policies

Profiles

User

Own profile only

Recruiter

Read applicants

Jobs

Recruiter

Own jobs

Candidate

Read only

Applications

Candidate

Own applications

Recruiter

Applications for own jobs

---

# Database Triggers

When user registers

↓

Create profile automatically

When application created

↓

Generate notification

When resume uploaded

↓

Call AI parser

↓

Store AI analysis

---

# Storage Flow

Candidate Upload

↓

Supabase Storage

↓

URL returned

↓

Express downloads

↓

pdf-parse

↓

OpenAI

↓

Structured JSON

↓

Store profile
