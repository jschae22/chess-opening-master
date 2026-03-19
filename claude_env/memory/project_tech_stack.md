---
name: Tech stack decisions
description: Confirmed technology choices for the Chess Opening Master platform
type: project
---

Stack is locked to: React/TypeScript/Vite frontend, Java Spring Boot backend (modular monolith), PostgreSQL on GCP Cloud SQL, Gemini AI coach (key server-side only), Cloud Run for hosting. Separate repos: frontend is `chess-opening-master`, backend is `chess-openings-master-services`.

**Why:** User wants to build industry-relevant experience; GCP chosen for natural Gemini integration; monolith-first to avoid premature distributed systems complexity.

**How to apply:** All backend work uses Spring Boot + JPA. Never suggest AWS or Azure services. Gemini API key must never be in frontend code — always proxied through the backend. Auth uses Spring Security with self-issued JWTs — no third-party provider. Username + bcrypt password only (max 20 alphanumeric chars), no email required. JWT signing key stored in GCP Secret Manager. Local dev uses Vite proxy + Docker Compose. CI/CD via GitHub Actions with staging (dev branch) and production (main branch) environments on Cloud Run.
