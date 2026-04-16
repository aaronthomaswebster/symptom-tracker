# Symptom Tracker

A health symptom tracker for logging occurrences of symptoms like fatigue, dizziness, nausea, and more. Built with Vue 3, Vuetify, Node.js/Express, and PostgreSQL — containerized with Podman.

## Prerequisites

- [Podman](https://podman.io/) with `podman compose` support
- A running Podman machine (`podman machine init && podman machine start`)

## Quick Start (Development)

```bash
./scripts/dev.sh
```

This starts all services with hot-reload:

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000
- **Database:** localhost:5432

Source files are mounted as volumes so changes are reflected immediately.

## Production Build

```bash
./scripts/prod.sh
```

Builds optimized images and runs in detached mode:

- **Frontend (nginx):** http://localhost
- **API:** http://localhost:3000

## Scripts

| Script | Description |
|---|---|
| `./scripts/dev.sh` | Start dev environment with hot-reload |
| `./scripts/dev-down.sh` | Stop dev environment |
| `./scripts/prod.sh` | Build and start production |
| `./scripts/prod-down.sh` | Stop production |
| `./scripts/reset-db.sh` | Wipe and re-seed the database |

## Architecture

```
symptom-tracker/
├── backend/          # Node.js/Express API
│   └── src/
│       ├── config/   # Database connection
│       ├── migrations/  # Schema + seed data
│       ├── models/   # Data access layer
│       └── routes/   # REST endpoints
├── frontend/         # Vue 3 + Vuetify SPA
│   └── src/
│       └── components/
├── scripts/          # Build & dev scripts
├── docker-compose.yml      # Production
└── docker-compose.dev.yml  # Development
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/symptoms` | List all symptom types |
| GET | `/api/symptoms/:id` | Get a symptom type |
| GET | `/api/logs` | List logged symptoms (supports `?limit=&offset=&symptom_id=`) |
| GET | `/api/logs/:id` | Get a specific log |
| POST | `/api/logs` | Create a new log |
| DELETE | `/api/logs/:id` | Delete a log |
| GET | `/api/health` | Health check |
