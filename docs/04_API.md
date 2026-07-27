# REST API Specification

Base URL

/api/v1

Response Format

{
"success":true,
"message":"Success",
"data":{}
}

---

# Authentication

POST /auth/register

POST /auth/login

POST /auth/logout

GET /auth/me

POST /auth/refresh

---

# Profile

GET /profile

PUT /profile

GET /profile/:id

DELETE /profile

---

# Resume

POST /resume/upload

Request

multipart/form-data

file

Response

resume_url

POST /resume/parse

Returns

summary

skills

education

experience

certifications

profile_completion

---

# Jobs

GET /jobs

Supports

search

page

limit

location

skills

salary

employment_type

GET /jobs/:id

POST /jobs

PUT /jobs/:id

DELETE /jobs/:id

PATCH /jobs/:id/status

---

# Applications

POST /applications

GET /applications

GET /applications/:id

PATCH /applications/:id/status

DELETE /applications/:id

---

# Recruiter Dashboard

GET /dashboard

Returns

Total Jobs

Total Applicants

Pending

Interview

Rejected

Offers

Analytics

---

# AI

POST /ai/match-score

Input

Candidate Profile

Job Description

Output

Match Score

Matching Skills

Missing Skills

Recommendation

---

POST /ai/candidate-summary

Returns

Professional Summary

---

POST /ai/resume-feedback

Returns

Suggestions

Grammar

ATS

Skills

Projects

---

# Notifications

GET /notifications

PATCH /notifications/read

DELETE /notifications/:id
