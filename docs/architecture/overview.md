# Architecture Overview

Orbitus is a two-application repository implemented as a frontend SPA and a backend modular monolith. This document describes the checked-in structure; it is not a promise that every optional integration is enabled in every environment.

## Runtime Components

```text
Browser
  ├── HTTPS REST requests ───────> Express API ─────> MongoDB
  └── Socket.IO connection ──────> Socket.IO server
                                      ├── Redis (optional shared state)
                                      └── external providers (optional)
```

- **Frontend (`frontend/`)**: React and Vite SPA. UI is grouped into reusable components, pages, hooks, state/context, and API services.
- **Backend (`backend/`)**: Express API and Socket.IO server, deployed as a long-running Node.js process.
- **MongoDB**: durable source of truth for application records.
- **Redis (`backend/src/infrastructure/redis/`)**: optional in local single-instance development; provides shared caching, rate-limit coordination, presence, and Socket.IO adapter support when configured. Its in-memory fallback is local to one process and is not equivalent to Redis in a multi-instance deployment.
- **External integrations**: email, Cloudinary, and AI providers are configured through environment variables and are feature-dependent.

## Backend Boundaries

```text
backend/src/
├── modules/          # Feature/domain routes, controllers, schemas, services, repositories
├── infrastructure/   # MongoDB, Redis, email, and storage adapters
├── shared/           # Cross-domain errors, HTTP helpers, validation
├── models/           # Mongoose data models
├── services/         # Cross-domain application services
├── middlewares/      # Authentication, rate limiting, and request middleware
├── socket/           # Socket.IO setup, event handlers, and presence
├── config/           # Environment and application configuration
├── database/         # Seed data and database setup utilities
├── scripts/          # Explicit maintenance and migration scripts
└── tests/            # Vitest tests
```

Domain modules currently include AI, auth, certificates, chat, dashboard, feedback, groups, notifications, posts, reviews, sessions, skills, and users. A domain module owns the feature workflow; shared adapters and cross-cutting services belong outside the module only when they are genuinely reused. Some legacy files may remain as compatibility entry points, so consult imports before removing or relocating code.

## Data and Cache Responsibilities

- MongoDB stores durable user, session, group, post, message, and other domain data.
- Redis stores transient/distributed state and cache data. Cache entries must not become the only copy of durable business records.
- If Redis is absent or unavailable, some features use process-local fallback behavior. This supports development and single-instance operation, but process memory is lost on restart and is not shared across replicas.
- Use the operations runbook before running a data migration. Migration scripts default to preview/dry-run behavior and require `--apply` to write changes.

## Authentication and Request Safety

- HTTP APIs use JWT-based authentication. Refresh tokens are delivered through HTTP-only cookies; production cookie/CORS behavior depends on the configured frontend origin and HTTPS deployment.
- Socket.IO connections authenticate at connection time and must be tested with the same production origin and token flow as the browser client.
- Request schemas use Zod in feature modules/shared validation. Authentication, authorization, validation, rate limiting, and error handling should be enforced at the server boundary, not only in the UI.
- Production secrets are configured by the hosting environment, never committed to the repository or exposed as frontend `VITE_*` values.

## Deployment Shape and Scaling

- The frontend is a Vite SPA and includes Vercel rewrite configuration.
- The backend requires a persistent Node.js service with WebSocket support and a reachable MongoDB database.
- For multiple backend instances, configure shared Redis and verify the hosting provider's Socket.IO transport/session-affinity requirements. A process-local fallback cannot provide cluster-wide presence, cache, or rate-limit state.
- `/health/live` is a process liveness probe. `/health/ready` checks MongoDB readiness; Redis degradation is reported but does not by itself make the service unready.
- Graceful shutdown and runtime settings are implemented in the backend server; deployment platforms should allow the process to receive termination signals and shut down cleanly.

## Local Redis

The root `docker-compose.yml` starts only Redis. It binds to `127.0.0.1:6379`, persists data in a named Docker volume, and does not start MongoDB or the application. Configure `REDIS_URL=redis://127.0.0.1:6379` in `backend/.env` to use it. Redis can be omitted for local single-process development.
