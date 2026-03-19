# Chess Opening Master — To-Do List

_Updated: 2026-03-18 (session 3)_

## Current Sequence

_Work through these in order — each step unlocks the next._

1. [x] Add GitHub MCP server
2. [x] Create Docker Compose for local PostgreSQL 16
3. [x] Install Docker Desktop + run `docker compose up -d` to start local DB
4. [x] Add `@modelcontextprotocol/server-postgres` MCP (connect to local DB)
5. [x] Decide Cloud SQL vs. cheaper DB host — **resolved: Neon for staging, Cloud SQL later**
6. [x] Create frontend `Dockerfile` (React/Vite → nginx)
7. [x] Set up GCP project (Cloud Run, Secret Manager, Artifact Registry)
8. [x] Write GitHub Actions CI workflow (lint + test + build on PRs)
9. [x] Write GitHub Actions CD workflow (deploy to Cloud Run on merge to `dev`/`main`)

---

## Design & Planning

- [ ] **API contract** — Define REST endpoints for the backend (openings CRUD, chat session, auth). Document as OpenAPI/Swagger spec or simple markdown.
- [ ] **AI coaching prompt design** — Decide on system prompt strategy: what context does the coach get per request? (opening name, move history, FEN, user message). Plan how to pass chat history to maintain conversation context.
- [ ] **Frontend ↔ Backend migration plan** — Gemini calls currently live on the frontend. Plan the cutover: new `/api/chat` and `/api/openings` endpoints replace direct `gemini.ts` calls before V1.
- [ ] **Openings data strategy** — Currently hardcoded in `constants/openings.ts`. Decide: seed the DB from this file, or curate data separately? Plan the seed script / migration.
- [ ] **Error & loading UX** — Define how the UI handles backend downtime, slow AI responses, and invalid moves gracefully.
- [ ] **V1 auth flow design** — Sketch the login/signup UX and JWT lifecycle (token storage, refresh strategy, logout).

---

## Frontend (this repo)

- [ ] Set up Vite proxy (`/api/*` → `http://localhost:8080`) for local backend dev
- [ ] Replace `gemini.ts` direct calls with `/api/chat` and `/api/openings` fetch calls (post-backend)
- [ ] Add opening detail page / variation navigation (currently single move sequence)
- [ ] Improve move history panel UX
- [ ] Write missing component/integration tests
- [ ] Add `.env.example` documentation for future API vars beyond `GEMINI_API_KEY`

---

## Backend (`chess-openings-master-services` repo — not yet started)

- [ ] Initialize Spring Boot project (Spring Web, Spring Data JPA, Spring Security, PostgreSQL driver)
- [ ] Implement `openings` REST endpoints: `GET /api/openings`, `GET /api/openings/{id}`
- [ ] Implement chat endpoint: `POST /api/chat` (wraps Gemini, holds server-side API key)
- [ ] Implement auth endpoints: `POST /api/auth/register`, `POST /api/auth/login` (JWT response)
- [ ] Protect chat endpoints with JWT auth (V1)
- [ ] Write JUnit tests for service and controller layers
- [ ] Create `application-local.yml` template (gitignored) with DB URL, Gemini key, JWT secret

---

## Database

- [ ] Write Flyway (or Liquibase) migration scripts for MVP schema (`openings` table)
- [ ] Write seed data migration with the 9 openings currently in `openings.ts`
- [ ] Plan V1 schema migrations (`users`, `favorite_openings`, `chat_sessions`, `chat_messages`)

---

## Infrastructure & DevOps

- [x] Set up Docker Compose for local PostgreSQL 16 — _file created, pending first run after Docker Desktop install_
- [x] Create `Dockerfile` for frontend (React/Vite → nginx static container)
- [ ] Create `Dockerfile` for Spring Boot service
- [x] **Database hosting decision (resolved):** Use Docker Compose locally + Neon free tier for staging. Migrate to Cloud SQL when real users warrant it. Migration path: `pg_dump` → `pg_restore` + swap JDBC URL in Secret Manager — no app code changes needed.
- [ ] Set up Neon project for staging PostgreSQL
- [x] Set up GCP project (Cloud Run, Secret Manager, Artifact Registry) — _skip Cloud SQL for now_
- [x] Write GitHub Actions CI workflow: lint + test + build on PRs
- [x] Write GitHub Actions CD workflow: deploy to Cloud Run on merge to `dev` (staging) and `main` (prod)
- [ ] Configure GCP Secret Manager with Gemini key, Neon DB URL, JWT signing key
- [ ] **Optional:** Add `@claude` GitHub Actions bot for automated PR assistance

---

## MCP / Tooling Setup

- [x] Add `@modelcontextprotocol/server-github` MCP to Claude Code config
- [ ] Add `@modelcontextprotocol/server-postgres` MCP (useful once local DB is running)
- [ ] Review Claude Code hooks — consider a `PostToolUse` hook to auto-lint after file edits

---

## Completed

- [x] Define tech stack
- [x] Define database schema (MVP + V1)
- [x] Bootstrap React frontend (chessboard, openings library, Gemini AI coach)
- [x] Define 9 chess openings in `constants/openings.ts`
- [x] Set up Vitest testing infrastructure
- [x] Create project to-do list (`claude_env/todo.md`)
- [x] Decide database hosting strategy (local Docker Compose + Neon staging, Cloud SQL deferred)
- [x] Add GitHub MCP server to Claude Code config
