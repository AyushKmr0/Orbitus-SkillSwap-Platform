# Orbitus Skill Swap Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://orbitus-skill-swap-platform.vercel.app)

Orbitus is a skill-sharing platform where learners and mentors can discover peers, exchange skills in scheduled sessions, chat, join study groups, share posts, track learning activity, and earn platform points and certificates.

## Repository Layout

```text
.
├── backend/                 # Express API and Socket.IO server
│   └── src/
│       ├── modules/         # Domain modules: auth, users, sessions, posts, etc.
│       ├── infrastructure/  # MongoDB, Redis, storage, and mail adapters
│       ├── shared/          # Shared errors, HTTP helpers, validation
│       ├── models/          # Mongoose models
│       ├── services/        # Cross-domain services
│       ├── middlewares/     # HTTP middleware
│       ├── socket/          # Socket.IO events and presence
│       └── tests/           # Vitest suites
├── frontend/                # React + Vite single-page application
├── docs/                    # Architecture notes and operations runbook
├── docker-compose.yml       # Optional local Redis service
└── package.json             # Convenience scripts for both apps
```

The backend is organized as a modular monolith. MongoDB is the durable data store. Redis is optional for a single local instance, and is used for shared caching, rate-limit state, presence, and Socket.IO coordination when configured. In-memory fallbacks are process-local and do not provide shared state across multiple backend replicas.

## Requirements

- Node.js `20.19.0` or newer
- npm
- MongoDB, local or managed
- Redis is optional for local development; use a managed Redis service for multi-instance production deployments

## Local Development

1. Install dependencies:

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Configure environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On Windows PowerShell, use `Copy-Item` instead of `cp` if needed. Set at least a reachable `MONGODB_URI` in `backend/.env`. Keep real secrets out of Git; `.env` files are ignored.

3. (Optional) Start local Redis with Docker:

   ```bash
   docker compose up -d redis
   ```

   The Compose file exposes Redis only on `127.0.0.1:6379` and persists data in a Docker volume. Set `REDIS_URL=redis://127.0.0.1:6379` in `backend/.env` to use it.

4. Start the apps in separate terminals from the repository root:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

   The backend defaults to `http://localhost:5000`; Vite prints the frontend URL (normally `http://localhost:3000`). Configure `VITE_BACKEND_URL` and `VITE_SOCKET_URL` in `frontend/.env` if your local addresses differ.

### Optional Seed Data

`npm run seed` seeds skills, demo community accounts, and an administrator account. Run it only against a disposable/local database: the seed script creates demo users and may generate an admin password when none is configured. Never run it against production without reviewing the script and database impact first.

## Useful Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:backend` | Start the API in watch mode |
| `npm run dev:frontend` | Start the Vite development server |
| `npm run lint` | Lint backend and frontend |
| `npm run lint:backend` | Lint backend only |
| `npm run lint:frontend` | Lint frontend only |
| `npm test` | Run the backend Vitest suite |
| `npm run build:frontend` | Create the frontend production build |
| `npm run verify` | Run lint, backend tests, and frontend build |
| `npm run seed` | Seed a local/test database; see warning above |

## Configuration

Use [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) as the authoritative variable lists. Production backend configuration must include strong, unique `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, and `MONGODB_URI` values. Set the production frontend origin in `FRONTEND_URL` (and `FRONTEND_URLS` if multiple origins are intentionally allowed). Configure OAuth, email, Cloudinary, AI providers, and Redis only for features that use them.

Never use the example placeholder values as production secrets, commit `.env` files, or expose backend secrets through `VITE_*` variables.

## Health Checks

- `GET /health/live` reports whether the process is alive.
- `GET /health/ready` reports readiness; it returns HTTP 503 when MongoDB is disconnected. Redis degradation is reported separately and does not make readiness fail.
- `GET /health` is the general health response.

## Deployment Notes

- Build and host the frontend as a Vite SPA; `frontend/vercel.json` contains the SPA routing configuration used by Vercel.
- Run the backend as a long-lived Node.js web service that supports WebSockets. Set `NODE_ENV=production`, `PORT` as required by the host, production secrets, MongoDB, the frontend origin, and any feature integrations in the host's secret manager.
- Configure Redis for shared rate limits, cache, presence, and Socket.IO coordination when running multiple backend instances. Verify the host's WebSocket and session-affinity behavior before scaling; local in-memory fallbacks are not cluster-wide.
- Take a database backup before running either migration under `backend/src/scripts/`. Their default mode is a dry run; pass `--apply` only after reviewing the output and confirming the backup.
- Run `npm run verify` before release. This is a repository check, not a substitute for testing the deployed OAuth callbacks, cookies/CORS, WebSocket connection, health endpoints, and core user flows in the production environment.

More detail: [Architecture overview](docs/architecture/overview.md) and [Operations runbook](docs/runbooks/operations.md).
