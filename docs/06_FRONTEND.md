# Frontend Specification

## Framework

React 19

Vite

TypeScript

TailwindCSS

shadcn/ui

---

# Folder Structure

frontend/src

app/

assets/

components/

features/

hooks/

layouts/

lib/

pages/

routes/

services/

store/

types/

utils/

main.tsx

App.tsx

---

# Feature Structure

features/

auth/

dashboard/

jobs/

profile/

applications/

ai/

notifications/

shared/

---

# Routes

/

Landing Page

/login

Register

/register

Dashboard

/dashboard

Candidate Profile

/profile

Upload Resume

/profile/upload-resume

Browse Jobs

/jobs

Job Details

/jobs/:id

My Applications

/applications

Recruiter Dashboard

/recruiter

Manage Jobs

/recruiter/jobs

Applicants

/recruiter/jobs/:id/applicants

Analytics

/recruiter/analytics

404

*

---

# Layouts

Public Layout

Navbar

Footer

Main Content

Candidate Layout

Sidebar

Navbar

Content

Recruiter Layout

Sidebar

Topbar

Dashboard Content

---

# Candidate Dashboard

Widgets

Welcome Card

Resume Status

Profile Completion

Recent Applications

Recommended Jobs

AI Suggestions

Quick Actions

---

# Recruiter Dashboard

Widgets

Jobs Created

Applicants

Shortlisted

Interviews

Offers

Analytics Chart

Recent Activity

---

# Landing Page

Hero Section

Features

How It Works

Testimonials

Latest Jobs

CTA

Footer

---

# Components

Navbar

Sidebar

Footer

StatCard

JobCard

ApplicationCard

CandidateCard

ResumeUploader

ProfileCompletion

SkillBadge

SearchBar

FilterPanel

Pagination

Toast

Modal

Loader

Skeleton

EmptyState

ErrorState

---

# Forms

Login

Register

Edit Profile

Create Job

Edit Job

Apply Job

Upload Resume

---

# State Management

TanStack Query

Authentication Context

Theme Context

No Redux

---

# API Layer

Axios

services/

auth.service.ts

job.service.ts

profile.service.ts

application.service.ts

ai.service.ts

---

# Validation

React Hook Form

Zod

Every form validated

---

# UI Principles

Responsive

Accessibility

Loading states

Error states

Empty states

Success messages

Dark Mode Ready
