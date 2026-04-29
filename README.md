# ForgeVibe

**A community platform where great code rises to the top.**

Built with a modern, production-ready stack: Spring Boot 3 · Java 21 · React 18 · Apache Kafka · PostgreSQL · Docker

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, TanStack Query, Wouter |
| Backend | Spring Boot 3.2, Java 21, Spring Security, Spring Session (JDBC) |
| AI Worker | Java 21 microservice (Kafka consumer → OpenAI GPT-4o-mini) |
| Database | PostgreSQL 16 with JPA / Hibernate auto-DDL |
| Messaging | Apache Kafka 3.x (event-driven analysis pipeline) |
| Auth | GitHub OAuth2 (Spring Security) + session cookies |
| Deployment | Docker Compose (8 containers), Nginx reverse proxy |

---

## Architecture

```
Browser
  └── localhost:3000 (Nginx reverse proxy)
        ├── /api/* ──────────────► backend:8080  (Spring Boot)
        │                              ├── PostgreSQL (JPA/Hibernate)
        │                              ├── Spring Session (JDBC)
        │                              ├── Kafka Producer → project.submitted / thought.submitted
        │                              └── Kafka Consumer ← project.analyzed / thought.reviewed
        │
        └── /* ─────────────────► frontend:80   (React SPA, pre-built)

kafka:9092
  ├── project.submitted  → ai-worker → scores repo with GPT-4o-mini (or mock)
  ├── project.analyzed   ← ai-worker → backend updates project + notifies author
  ├── thought.submitted  → ai-worker → moderates post
  └── thought.reviewed   ← ai-worker → backend sets status (published / blocked)

localhost:9000  →  Kafdrop (Kafka topic browser)
```

---

## Features

- **Trending feed** — projects and thoughts ranked by ForgeVibe score
- **AI analysis** — GitHub repos scored for architecture, security, quality, and docs
- **AI auto-tagging** — tech stack detected automatically from repo content
- **Spaces** — community spaces (React, AI/ML, DevOps, etc.) with member posts and likes
- **Thoughts** — short-form posts with AI moderation before publishing
- **Reactions & diamonds** — like, fire, rocket reactions; weekly diamond award (1 per user per week)
- **Leaderboard** — all-time and monthly rankings by ForgeVibe score
- **Notifications** — in-app alerts for likes, diamonds, comments, analysis results
- **Admin dashboard** — report review and content moderation
- **Dark / light mode** — persisted theme toggle

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker Desktop | ≥ 4.x |
| Docker Compose | ≥ 2.x (included with Docker Desktop) |

No Java or Node.js needed locally — everything runs inside Docker.

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd forgevibe

# 2. Configure environment
cp .env.example .env
# Edit .env:
#   - Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (required for Sign in with GitHub)
#   - Set OPENAI_API_KEY (optional — leave blank for mock AI scoring)
#   - Set APP_BASE_URL to your public URL in production

# 3. Start everything
docker compose up --build
```

First run takes ~3–5 minutes (Maven + npm dependency downloads).  
Subsequent runs start in ~30 seconds.

| URL | Description |
|-----|-------------|
| http://localhost:3000 | ForgeVibe app |
| http://localhost:9000 | Kafdrop — Kafka topic browser |
| http://localhost:8080/api | Backend API (direct) |

---

## GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Set **Homepage URL**: `http://localhost:3000`
3. Set **Authorization callback URL**: `http://localhost:3000/login/oauth2/code/github`
4. Copy the **Client ID** and **Client Secret** into `.env`

For production, replace `localhost:3000` with your domain.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | Yes | — | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | — | GitHub OAuth App client secret |
| `OPENAI_API_KEY` | No | _(mock mode)_ | GPT-4o-mini key for real AI analysis |
| `APP_BASE_URL` | Prod | `http://localhost:3000` | Public base URL (used for OAuth redirect) |
| `DEMO_LOGIN_ENABLED` | No | `false` | Enable demo user login (development only) |
| `POSTGRES_USER` | No | `forgevibe` | PostgreSQL username |
| `POSTGRES_PASSWORD` | No | _(see .env.example)_ | PostgreSQL password |

---

## AI Analysis Pipeline

### With OpenAI key (`OPENAI_API_KEY` set)
- Calls `gpt-4o-mini` to analyse repository README, code structure, and description
- Scores architecture, security, code quality, and documentation (0–100 each)
- Auto-detects tech stack tags (Java, React, TypeScript, etc.)
- Returns a "vibe check", strengths, and improvement areas

### Without key (mock mode — default)
- Deterministic keyword-based scoring — no API cost
- Ideal for local development and testing

### Thought moderation thresholds
| AI confidence | Status | Result |
|---------------|--------|--------|
| ≥ 80 | `published` | Post goes live immediately |
| 50–79 | `needs_context` | Yellow panel — user can edit and resubmit |
| < 50 | `blocked` | Red panel — user can request manual review |

---

## Spaces

Pre-seeded community spaces (joinable by any signed-in user):

- ⚛️ React Developers
- ☕ Java & Spring
- 🤖 AI / ML
- ☁️ DevOps & Cloud
- 🌐 Open Source
- 🔐 Security Research
- 🛠️ Side Projects
- 💎 TypeScript
- 🐍 Python

Users can create additional spaces. Space owners can post without joining. Members can post, like, and comment.

---

## ForgeVibe Score

```
forgevibeScore = (diamonds × 50) + (stars × 3) + likes + (aiScore × 0.4)
```

User reputation score accumulates from received diamonds, stars, and likes.

---

## API Reference

### Auth
```
GET  /api/auth/me                         — current session user
POST /api/auth/logout
```

### Feed
```
GET  /api/feed?filter=all|thoughts|projects&sort=trending|new
```

### Thoughts
```
POST /api/thoughts                         { title, content }
GET  /api/thoughts
GET  /api/thoughts/:id
POST /api/thoughts/:id/react               { reactionType }
POST /api/thoughts/:id/appeal              { message }
GET  /api/thoughts/:id/comments
POST /api/thoughts/:id/comments            { content, parentId? }
```

### Projects
```
POST /api/projects                         { title, description, repoUrl, liveUrl, stack }
GET  /api/projects
GET  /api/projects/:id
POST /api/projects/:id/react               { reactionType: "like"|"fire"|"rocket"|"mind_blown" }
POST /api/projects/:id/diamond             { note? }
POST /api/projects/:id/reanalyze
PATCH /api/projects/:id/tags              { tags: string[] }
GET  /api/projects/:id/comments
POST /api/projects/:id/comments            { content }
```

### Spaces
```
GET  /api/spaces
POST /api/spaces                           { name, description, emoji }
GET  /api/spaces/:id
POST /api/spaces/:id/join
POST /api/spaces/:id/leave
GET  /api/spaces/:id/posts
POST /api/spaces/:id/posts                 { content }
POST /api/spaces/posts/:id/like
GET  /api/spaces/posts/:id/comments
POST /api/spaces/posts/:id/comments        { content }
```

### Users & Leaderboard
```
GET  /api/users/:username
GET  /api/leaderboard?period=all|monthly
```

### Notifications
```
GET  /api/notifications
POST /api/notifications/read-all
```

### Reports
```
POST /api/reports                          { contentType, contentId, reason }
```

### Admin (requires ADMIN role)
```
GET  /api/admin/reports
POST /api/admin/reports/:id/resolve        { status: "approved"|"rejected" }
```

---

## Project Structure

```
forgevibe/
├── backend/                     Spring Boot API (port 8080)
│   └── src/main/java/com/forgevibe/
│       ├── config/              Kafka config, exception handler, data initializer
│       ├── controller/          REST controllers
│       ├── dto/                 Request / Response DTOs
│       ├── entity/              JPA entities
│       ├── event/               Kafka event records
│       ├── kafka/               Producer + Consumer services
│       ├── repository/          Spring Data JPA repositories
│       ├── security/            Spring Security, GitHub OAuth2, session
│       └── service/             Business logic
│
├── ai-worker/                   Headless Kafka microservice
│   └── src/main/java/com/forgevibe/aiworker/
│       ├── consumer/            ThoughtConsumer, ProjectConsumer
│       ├── event/               Event DTOs (mirrors backend)
│       └── service/             AiValidationService (OpenAI or mock)
│
├── frontend/                    React 18 SPA (TypeScript + Vite)
│   └── src/
│       ├── components/          Shared UI components
│       ├── hooks/               useAuth, useTheme, useReactions
│       ├── lib/                 API client, query client
│       └── pages/               Route-level page components
│
├── nginx/
│   └── nginx.conf               Reverse proxy config
│
├── docker-compose.yml           All 8 services wired together
├── .env.example                 Environment variable template (commit this)
├── .env                         Local secrets (never commit — in .gitignore)
└── README.md
```

---

## Development (without Docker)

```bash
# Start only infrastructure
docker compose up postgres zookeeper kafka kafka-ui -d

# Backend (Java 21 + Maven required)
cd backend && ./mvnw spring-boot:run

# AI worker
cd ai-worker && ./mvnw spring-boot:run

# Frontend (Node 20 required)
cd frontend && npm install && npm run dev
```

---

## Stopping

```bash
# Stop all containers (data preserved)
docker compose down

# Stop and delete all data (fresh start)
docker compose down -v
```

---

## Security Notes (for production)

- Set `APP_BASE_URL` to your real domain — CORS is locked to this origin
- Rotate `GITHUB_CLIENT_SECRET` and `POSTGRES_PASSWORD` before deploying
- `DEMO_LOGIN_ENABLED` defaults to `false` — never enable in production
- Session cookies are `HttpOnly`, `SameSite=Lax`, and scoped to your domain
- Kafka trusted packages are restricted to `com.forgevibe.event` only
