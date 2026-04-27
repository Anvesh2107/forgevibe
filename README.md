# ForgeVibe — Java Edition 🔨

**Stack:** Spring Boot 3.2.4 · Java 21 · Apache Kafka · PostgreSQL · React · Docker Compose

---

## Architecture

```
Browser
  └── localhost:3000 (Nginx)
        ├── /api/* ──────────────► backend:8080 (Spring Boot)
        │                              ├── PostgreSQL (JPA)
        │                              ├── Kafka Producer → thought.submitted
        │                              └── Kafka Consumer ← thought.reviewed
        │
        └── /* ─────────────────► frontend:80 (React SPA)

kafka:9092 (Kafka Broker)
  ├── thought.submitted  → ai-worker consumes → GPT-4o-mini (or mock)
  ├── thought.reviewed   ← ai-worker publishes → backend updates DB
  ├── project.submitted  → ai-worker consumes
  ├── project.analyzed   ← ai-worker publishes
  └── report.filed       → moderation queue

localhost:9000  →  Kafdrop (Kafka UI — browse topics, messages)
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | ≥ 4.x | https://docs.docker.com/get-docker/ |
| Docker Compose | ≥ 2.x | Included with Docker Desktop |

> **No Java or Node.js needed on your machine.** Everything runs inside Docker.

---

## Quick Start (One Command)

```bash
# 1. Clone / unzip the project
cd forgevibe-java

# 2. (Optional) Add OpenAI key for real AI moderation
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-... (leave blank for mock AI)

# 3. Build and start all services
docker compose up --build
```

**First run takes ~3–5 minutes** (Maven downloads dependencies, npm installs packages).
Subsequent runs start in ~30 seconds.

### URLs

| Service | URL | Description |
|---------|-----|-------------|
| App | http://localhost:3000 | ForgeVibe (React + API) |
| Kafka UI | http://localhost:9000 | Kafdrop — browse Kafka topics |
| Backend API | http://localhost:8080/api | Spring Boot REST API (direct) |

---

## Demo Login

The app uses demo users (no passwords needed). Pick any user 1–7:

| ID | Username | Person |
|----|----------|--------|
| 1 | torvalds_demo | Linus Torvalds |
| 2 | gvanrossum_demo | Guido van Rossum |
| 3 | addyosmani_demo | Addy Osmani |
| 4 | dhh_demo | DHH |
| 5 | primeagen_demo | ThePrimeagen |
| 6 | simonw_demo | Simon Willison |
| 7 | karpathy_demo | Andrej Karpathy |

---

## Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `thought.submitted` | backend | ai-worker | New post → AI review |
| `thought.reviewed` | ai-worker | backend | AI result → update DB |
| `project.submitted` | backend | ai-worker | New project → AI score |
| `project.analyzed` | ai-worker | backend | AI score → update DB |
| `report.filed` | backend | (manual review) | Spam reports |

Browse all messages at **http://localhost:9000**

---

## AI Moderation

### With OpenAI (set `OPENAI_API_KEY` in `.env`)
- Calls `gpt-4o-mini` to evaluate tech relevance
- Returns confidence 0–100 + reason

### Without API key (default — mock scoring)
- Counts tech keywords in the post
- Fully deterministic, no API costs
- Great for local testing

### Thresholds (both modes)
| Confidence | Status | Outcome |
|------------|--------|---------|
| ≥ 80 | published | Post goes live |
| 50–79 | needs_context | Yellow panel, user can edit & resubmit |
| < 50 | blocked | Red panel, user can request manual review |

---

## API Reference

### Auth
```
POST /api/auth/login-demo   { "userId": 1 }
GET  /api/auth/me
POST /api/auth/logout
```

### Feed
```
GET  /api/feed?filter=all|thoughts|projects
```

### Thoughts (Posts)
```
POST /api/thoughts                        — submit new thought
GET  /api/thoughts                        — list published thoughts
GET  /api/thoughts/:id
POST /api/thoughts/:id/react              { "reactionType": "agree"|"brilliant"|"build_it"|"respect"|"fire" }
POST /api/thoughts/:id/appeal             { "message": "..." }
GET  /api/thoughts/:id/comments
POST /api/thoughts/:id/comments           { "content": "...", "parentId": null|<id> }
```

### Projects
```
POST /api/projects                        — submit new project
GET  /api/projects
GET  /api/projects/:id
POST /api/projects/:id/react              { "reactionType": "..." }
POST /api/projects/:id/star
POST /api/projects/:id/diamond
GET  /api/projects/:id/comments
POST /api/projects/:id/comments
```

### Reports
```
POST /api/reports                         { "contentType": "thought"|"project", "contentId": 1, "reason": "..." }
```

### Leaderboard
```
GET  /api/leaderboard?period=all|monthly
```

### Admin
```
GET  /api/admin/reports
POST /api/admin/reports/:id/resolve       { "status": "approved"|"rejected" }
```

---

## Stopping

```bash
# Stop all containers (keeps DB data)
docker compose down

# Stop and wipe ALL data (fresh start)
docker compose down -v
```

---

## Development (without Docker)

If you want to run services individually:

```bash
# 1. Start infrastructure
docker compose up postgres zookeeper kafka kafka-ui -d

# 2. Run backend (requires Java 21 + Maven)
cd backend
./mvnw spring-boot:run

# 3. Run AI worker
cd ai-worker
./mvnw spring-boot:run

# 4. Run frontend (requires Node 20)
cd frontend
npm install
npm run dev
```

---

## ForgeVibe Score Formula

```
score = (diamonds × 50) + (stars × 3) + (totalLikes × 1)
```

Higher AI scores on projects increase the score multiplier for diamond awards.

---

## Project Structure

```
forgevibe-java/
├── backend/                    Spring Boot API
│   ├── src/main/java/com/forgevibe/
│   │   ├── entity/             JPA entities (User, Project, ThoughtPost, ...)
│   │   ├── repository/         Spring Data repositories
│   │   ├── service/            Business logic
│   │   ├── controller/         REST controllers
│   │   ├── kafka/              Producer + Consumer
│   │   ├── event/              Kafka event DTOs
│   │   ├── dto/                Request/Response DTOs
│   │   ├── security/           Spring Security + session
│   │   └── config/             Kafka config, exception handler
│   └── Dockerfile
│
├── ai-worker/                  Headless Kafka consumer microservice
│   ├── src/main/java/com/forgevibe/aiworker/
│   │   ├── consumer/           ThoughtConsumer, ProjectConsumer
│   │   ├── service/            AiValidationService (OpenAI or mock)
│   │   ├── event/              Event DTOs
│   │   └── config/             Kafka config
│   └── Dockerfile
│
├── frontend/                   React SPA (copied from Node.js version)
│   ├── src/
│   └── Dockerfile              Builds → serves with Nginx
│
├── nginx/
│   └── nginx.conf              Reverse proxy: /api/* → backend, /* → frontend
│
├── docker-compose.yml          Orchestrates all 8 services
├── .env.example                Environment variable template
└── README.md                   This file
```
