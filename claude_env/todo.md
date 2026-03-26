# Chess Opening Master — To-Do List

_Updated: 2026-03-26 (session 7)_

## Current Sequence

_Work through these in order — each step unlocks the next._

1. [x] Reduce Gemini API usage for MVP — remove all automated calls; Gemini is only invoked when the user explicitly submits a chat message. Remove `getOpeningSuggestions` calls entirely for now. Fix model name (`gemini-2.0-flash`).
2. [ ] Configure GCP Secret Manager — add Gemini API key, Neon DB URL, JWT signing key
3. [ ] Deploy backend to Cloud Run — verify it connects to Neon and `/api/openings` responds
4. [ ] Set `VITE_API_BASE_URL` env var for production build; lock down Spring Boot CORS to frontend Cloud Run origin only
5. [ ] Deploy frontend to Cloud Run — verify it loads and fetches openings from backend
6. [ ] Add IP-based rate limiting on `/api/chat` (Bucket4j or Cloud Run ingress rules)
7. [ ] Add security headers to nginx config (`X-Frame-Options`, `X-Content-Type-Options`, basic CSP)
8. [ ] Set up Cloud Run error rate alert — notify on elevated 5xx responses
9. [ ] Implement error/loading UX for backend downtime and slow/failed Gemini responses
10. [ ] Add input length validation on `/api/chat` request body
11. [ ] End-to-end smoke test on live URLs — openings load, moves play, AI coach responds

---

## Design & Planning

- [ ] **API contract** — Define REST endpoints for the backend (openings CRUD, chat session, auth). Document as OpenAPI/Swagger spec or simple markdown.
- [ ] **AI coaching prompt design** — Decide on system prompt strategy: what context does the coach get per request? (opening name, move history, FEN, user message). Plan how to pass chat history to maintain conversation context.
- [x] **Frontend ↔ Backend migration plan (openings done)** — `GET /api/openings` live; frontend fetches from backend. Remaining: `/api/chat` replaces `gemini.ts` (step 8 in sequence).
- [x] **Openings data strategy** — Seeded directly from `constants/openings.ts` data via Flyway V2 migration.
- [ ] **Error & loading UX** — Define how the UI handles backend downtime, slow AI responses, and invalid moves gracefully.
- [ ] **V1 auth flow design** — Sketch the login/signup UX and JWT lifecycle (token storage, refresh strategy, logout).
- [ ] **V1 privacy policy** — Write privacy policy covering PII collected via user accounts (username, chat history, favorites). Required before V1 goes live.

---

## Frontend (this repo)

- [x] Set up Vite proxy (`/api/*` → `http://localhost:8080`) for local backend dev
- [ ] Replace `gemini.ts` direct calls with `/api/chat` and `/api/openings` fetch calls (post-backend)
- [ ] Add opening detail page / variation navigation (currently single move sequence)
- [ ] Improve move history panel UX
- [ ] Write missing component/integration tests
- [ ] Add `.env.example` documentation for future API vars beyond `GEMINI_API_KEY`

---

## Backend (`chess-openings-master-services` repo)

- [x] Initialize Spring Boot project (Spring Web, Spring Data JPA, Spring Security, PostgreSQL driver)
- [x] Implement `openings` REST endpoints: `GET /api/openings`, `GET /api/openings/{id}`
- [ ] Implement chat endpoint: `POST /api/chat` (wraps Gemini, holds server-side API key)
- [ ] Implement auth endpoints: `POST /api/auth/register`, `POST /api/auth/login` (JWT response)
- [ ] Protect chat endpoints with JWT auth (V1)
- [ ] Write JUnit tests for service and controller layers
- [x] Create `application-local.yml` template (gitignored) with DB URL, Gemini key, JWT secret

---

## Database

- [x] Write Flyway migration scripts for MVP schema (`openings` table)
- [x] Write seed data migration with the 9 openings currently in `openings.ts`
- [x] Plan V1 schema migrations — defined in `claude_env/schema.md`; implementation is step 3 in current sequence

---

## Infrastructure & DevOps

- [x] Set up Docker Compose for local PostgreSQL 16 — _file created, pending first run after Docker Desktop install_
- [x] Create `Dockerfile` for frontend (React/Vite → nginx static container)
- [x] Create `Dockerfile` for Spring Boot service
- [x] **Database hosting decision (resolved):** Use Docker Compose locally + Neon free tier for staging. Migrate to Cloud SQL when real users warrant it. Migration path: `pg_dump` → `pg_restore` + swap JDBC URL in Secret Manager — no app code changes needed.
- [x] Set up Neon project for staging PostgreSQL
- [x] Set up GCP project (Cloud Run, Secret Manager, Artifact Registry) — _skip Cloud SQL for now_
- [x] Write GitHub Actions CI workflow: lint + test + build on PRs
- [x] Write GitHub Actions CD workflow: deploy to Cloud Run on merge to `dev` (staging) and `main` (prod)
- [ ] Configure GCP Secret Manager with Gemini key, Neon DB URL, JWT signing key
- [ ] **Optional:** Add `@claude` GitHub Actions bot for automated PR assistance

---

## MCP / Tooling Setup

- [x] Add `@modelcontextprotocol/server-github` MCP to Claude Code config
- [x] Add `@modelcontextprotocol/server-postgres` MCP (connected to local DB)
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
