# Lab Equipment Tracker

![CI](https://github.com/mclovinR/lab-equipment-tracker/actions/workflows/ci.yml/badge.svg)

REST API to register, track and reserve shared lab equipment (oscilloscopes, single-board computers, 3D printers, etc.), preventing double bookings.

**Stack:** TypeScript · Node.js · Express · PostgreSQL · Docker · GitHub Actions · Jest · Python · Bash

## Features

- [x] Equipment catalog (list, detail, create)
- [x] Input validation and consistent JSON errors
- [x] Containerized API + database with one command
- [x] CI pipeline: lint, type check, tests, build and Docker image
- [ ] Users CRUD
- [ ] Reservations with overlap detection
- [ ] Reservation cancellation rules
- [ ] Usage report and database backup script (Python)

## Architecture

```
HTTP request
   │
   ▼
Routes (equipment.routes.ts)      → parse and validate input, send HTTP response
   │
   ▼
Service (equipment.service.ts)    → business rules (no HTTP, no SQL)
   │
   ▼
Repository (equipment.repository.ts) → SQL queries against PostgreSQL
   │
   ▼
PostgreSQL
```

The service depends on a repository **interface**, so tests use an in-memory implementation and run without a database.

## Getting started

Requirements: Docker.

```bash
./scripts/setup.sh
# or
docker compose up -d --build
```

The API runs at `http://localhost:3000`.

### Local development (without containerizing the API)

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run dev
```

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/equipment` | List equipment |
| GET | `/api/equipment/:id` | Get one item |
| POST | `/api/equipment` | Create equipment |

Example:

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{"name": "Fluke 117 Multimeter", "category": "measurement"}'
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run with auto-reload |
| `npm test` | Run tests |
| `npm run lint` | Lint the code |
| `npm run typecheck` | Type-check without building |
| `npm run build` | Compile to `dist/` |
| `python scripts/backup_and_report.py` | Database backup + CSV report |

## Technical decisions

- **PostgreSQL**: strong constraints (`CHECK`, foreign keys), `RETURNING`, and good support for time ranges, which fit reservations.
- **Layered architecture + dependency injection**: business logic is testable without a database.
- **Docker Compose**: anyone can run the full stack with one command, same environment everywhere.
- **Zod**: runtime validation for request data, since TypeScript types disappear at runtime.

## Author

Alexander Rodríguez Del Valle · [GitHub](https://github.com/mclovinR)
