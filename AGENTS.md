# AI Development Rules

This project is intended to be built by an AI coding assistant.

Follow these instructions exactly.

---

# Architecture

Use Feature-Based Architecture.

Never use MVC folders like:

controllers
models
views

Instead use:

backend/src/modules

Each module contains

- controller
- service
- routes
- validation
- repository
- types

---

# Frontend

Use

React

Vite

TypeScript

TailwindCSS

shadcn/ui

React Router

TanStack Query

React Hook Form

Zod

---

# Backend

Node.js

Express

TypeScript

Zod

JWT

Multer

Helmet

Morgan

dotenv

Never put business logic inside controllers.

Controllers call Services.

Services call Repositories.

Repositories communicate with Supabase.

---

# Coding Standards

Always

Use async/await

Return typed responses

Handle errors

Validate every request

Use environment variables

Never hardcode secrets

---

# React Rules

Functional Components only.

Never use class components.

Use hooks.

Each page has

Loading State

Error State

Empty State

Success State

---

# Styling

TailwindCSS only.

Never use inline CSS.

Never use Bootstrap.

Use shadcn components.

---

# Authentication

Supabase Auth

JWT

Protected Routes

Role Based Access

Candidate

Recruiter

---

# API

REST API

Version

/api/v1/

Always return

{
success,
message,
data
}

---

# Database

Never access Supabase directly from React.

React

↓

Express API

↓

Supabase

---

# AI

OpenAI API

Never parse resume in frontend.

Backend only.

---

# Git

Use conventional commits.

Example

feat(auth)

fix(api)

docs(readme)

refactor(profile)

---

# Testing

Unit Tests

Integration Tests

Manual Testing

---

# Goal

Produce production-ready clean code.