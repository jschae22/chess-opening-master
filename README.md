# Chess Opening Master

A chess website for players who want to learn and practice openings with the help of a generative AI coach. Chess engines can tell you the next best move — they can't explain *why*. This app bridges that gap: browse openings, play through the moves on an interactive board, and chat with an AI coach that explains the ideas and reasoning behind each move in plain language.

**Roadmap:** MVP (openings library + AI coach) → V1 (user accounts, saved favorites, chat history) → V2 (game uploads + notes) → Practice mode (play through openings with the coach)

---

## Tech Stack

**Frontend**
- React 19 + TypeScript, built with Vite
- Tailwind CSS, react-chessboard, chess.js

**Backend**
- Java / Spring Boot (REST API)
- Spring Security with self-issued JWTs
- JPA / Hibernate + PostgreSQL

**AI**
- Google Gemini 2.0 Flash via the backend — API key is never exposed to the browser

**Infrastructure (GCP)**
- Cloud Run (containerized deployments)
- Secret Manager (API keys, DB credentials, JWT signing key)
- GitHub Actions CI/CD: lint + test + build on PRs, deploy to staging on `dev` merge, deploy to production on `main` merge

---

## Architecture

```
Browser
  │
  │  HTTPS
  ▼
nginx (static server + reverse proxy)
  │
  ├── /* ──────────────────────► React SPA (Vite build)
  │
  └── /api/* ──────────────────► Spring Boot (Cloud Run)
                                      │
                              ┌───────┴────────┐
                              │                │
                         PostgreSQL       Gemini API
                         (Neon/Cloud SQL)  (server-side)
```

The frontend is a static React app served by nginx inside a single Cloud Run container. API calls go through nginx as a reverse proxy to the Spring Boot backend service (a separate Cloud Run container). Gemini is called exclusively from the backend, keeping the API key out of the browser entirely.

**Repositories**
- Frontend: `chess-opening-master` (this repo)
- Backend: [chess-openings-master-services](https://github.com/jschae22/chess-openings-master-services)
