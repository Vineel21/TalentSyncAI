# GitHub Actions

Workflow Name

CI/CD Pipeline

Trigger

Push to main

Pull Request

---

# Frontend Pipeline

Checkout

↓

Install Node

↓

Install Dependencies

↓

Run ESLint

↓

Run Build

↓

Deploy to Vercel

---

# Backend Pipeline

Checkout

↓

Install Node

↓

Install Dependencies

↓

Run Type Check

↓

Run Lint

↓

Run Build

↓

Deploy to Render

---

# Secrets

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

OPENAI_API_KEY

JWT_SECRET

VERCEL_TOKEN

VERCEL_PROJECT_ID

VERCEL_ORG_ID

RENDER_API_KEY

RENDER_SERVICE_ID

---

# Build Rules

No warnings

No failed lint

No failed TypeScript

No failed tests

---

# Deployment

Frontend

Vercel Production

Backend

Render Production

---

# Notifications

GitHub Status

Deployment Success

Deployment Failed
