# Backend Specification

## Runtime

Node.js

Express.js

TypeScript

---

# Folder Structure

backend/src

config/

middleware/

modules/

shared/

utils/

types/

server.ts

---

# Modules

auth

profile

jobs

applications

dashboard

ai

notifications

---

# Module Structure

jobs/

controller.ts

service.ts

repository.ts

routes.ts

validation.ts

types.ts

constants.ts

---

# Request Flow

Client

↓

Route

↓

Validation

↓

Controller

↓

Service

↓

Repository

↓

Supabase

↓

Response

---

# Middleware

Authentication

Authorization

Validation

Rate Limiter

Error Handler

Request Logger

Helmet

Compression

CORS

---

# Repository Layer

Repositories ONLY communicate with Supabase.

No SQL inside Controllers.

No SQL inside Services.

---

# Services

Business Logic

AI Calls

Profile Completion

Application Logic

Job Search

Analytics

---

# Error Response

{
success:false,
message:"",
data:{
code:"",
errors:[]
}
}

---

# Success Response

{
success:true,
message:"",
data:{}
}

---

# Logging

Morgan

Errors

Console only in Development

---

# Validation

Zod

Every request validated

---

# File Upload

Multer

Allowed

PDF

Maximum

5MB

---

# Resume Parsing Flow

Upload

↓

Supabase Storage

↓

Download

↓

pdf-parse

↓

Google Gemini (`gemini-3.6-flash`)

↓

Structured JSON

↓

Save Profile

---

# AI Provider Configuration

Backend runtime only

`GEMINI_API_KEY`

`GEMINI_MODEL=gemini-3.6-flash`

`GEMINI_SERVICE_TIER=unpaid|paid`

`GEMINI_TIMEOUT_MS=30000`

`GEMINI_TIMEOUT_MS` is one total provider-operation budget shared across bounded retries.

Candidate-data calls require `GEMINI_SERVICE_TIER=paid`, backed by a Gemini API project with active Cloud Billing. Production configuration rejects `unpaid`. Unpaid access is reserved for synthetic development checks containing no personal or confidential data.

---

# Dashboard Service

Statistics

Recent Jobs

Recent Applications

Charts

Notifications
