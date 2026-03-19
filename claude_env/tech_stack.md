# Tech Stack

## Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Chess UI:** react-chessboard + chess.js
- **Animations:** Motion (Framer Motion)
- **Icons:** lucide-react

## Backend
- **Language:** Java
- **Framework:** Spring Boot
- **Architecture:** Modular monolith for MVP/V1, extract microservices at later milestones
- **API Style:** REST

## Database
- **Primary:** PostgreSQL (via Cloud SQL on GCP)
- **ORM:** JPA / Hibernate

## AI
- **Model:** Google Gemini (gemini-2.0-flash)
- **SDK:** @google/genai (frontend prototype only — key moves to backend before V1)
- **API key:** Stored server-side, never exposed to the browser

## Authentication
- **Approach:** Spring Security with self-issued JWTs (no third-party auth provider)
- **Credentials:** Username + bcrypt-hashed password stored in our DB
- **No email required** — users sign up with username + password only

## Repositories
- **Frontend:** `chess-opening-master` (current repo)
- **Backend:** `chess-openings-master-services` (new repo, Spring Boot)

## Cloud (GCP)
- **Container Hosting:** Cloud Run (serverless containers)
- **Database:** Cloud SQL (PostgreSQL)
- **Secrets:** Secret Manager (for Gemini API key, DB credentials, JWT signing key)
- **CI/CD:** GitHub Actions → Artifact Registry → Cloud Run
- **Environments:** staging (deploy on merge to `dev`) + production (deploy on merge to `main`)
- **PR checks:** lint + test + build on every pull request
- **Secrets at runtime:** pulled from GCP Secret Manager, never baked into images

## Local Development
- **Frontend → Backend:** Vite proxy (`/api/*` → `http://localhost:8080`) — no CORS config needed locally
- **Frontend port:** 3000, **Backend port:** 8080
- **Local DB:** Docker Compose running PostgreSQL 16
- **Backend secrets:** `application-local.yml` (gitignored) — DB URL, Gemini API key, JWT secret
- **Run order:** `docker compose up -d` → Spring Boot (`local` profile) → Vite dev server

## Testing
- **Frontend:** Vitest + @testing-library/react (jsdom)
- **Backend:** JUnit 5 + Mockito (Spring Boot test slice annotations)
