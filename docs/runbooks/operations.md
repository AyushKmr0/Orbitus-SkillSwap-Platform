# Operations Runbook

This runbook covers configuration checks and routine operational tasks. Provider dashboards and secret managers are the source of truth for production credentials; never store real values in this repository.

## Production Configuration

Set environment variables in the backend hosting platform's secret/configuration manager. At minimum, the backend validates these in production:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production` |
| `PORT` | Port provided by the hosting platform |
| `MONGODB_URI` | Production MongoDB connection string |
| `JWT_SECRET` | Strong, unique signing secret for access tokens |
| `JWT_REFRESH_SECRET` | Separate strong, unique signing secret for refresh tokens |
| `ENCRYPTION_KEY` | Secret used to encrypt sensitive user-provided AI keys |
| `FRONTEND_URL` | Canonical frontend origin allowed by the backend |

Also configure `FRONTEND_URLS` if the application intentionally serves multiple frontend origins. Configure `REDIS_URL` for shared cache, rate-limit state, presence, and Socket.IO coordination, especially when running multiple backend instances. Configure provider credentials only for enabled features (OAuth, SMTP, Cloudinary, and AI). The examples in `backend/.env.example` and `frontend/.env.example` are placeholders, not production values.

Do not reuse JWT secrets, expose backend secrets through `VITE_*`, or rotate `ENCRYPTION_KEY` casually. Existing encrypted values may become unreadable after a key change; plan and test a migration/backup before changing it.

## Deploy and Verify

1. Ensure production MongoDB backups are enabled and the application can connect to the database.
2. Deploy the backend as a persistent Node.js service with WebSocket support; configure its health check to `GET /health/ready` if the platform supports readiness probes.
3. Deploy the frontend with the correct production `VITE_BACKEND_URL` and `VITE_SOCKET_URL` build-time settings, and verify SPA route rewrites.
4. Verify OAuth provider callback URLs, allowed origins, HTTPS, cookie behavior, and the Socket.IO connection from the deployed frontend.
5. Check the health endpoints:
   - `GET /health/live`: process liveness; HTTP 200 while the process is running.
   - `GET /health/ready`: HTTP 200 when MongoDB is connected, otherwise HTTP 503. Redis state is reported separately; Redis degradation alone does not fail readiness.
   - `GET /health`: general health response, including database/cache status.
6. Smoke-test registration/login, a core user workflow, and any enabled integrations after deployment. `npm run verify` is useful before release but does not test provider configuration in the deployed environment.

## Seed Data and Administrator Access

`npm run seed` is for local or disposable test databases. It seeds demo accounts and skills and may create an administrator account (including generating a temporary password if none is configured). Do not run it against production as a routine deployment step. If production needs an administrator, provision or promote a known account through a controlled database/admin procedure, verify the role, and use a unique strong password. Never expose admin credentials in URLs, logs, or browser storage.

## Database Migrations

The scripts below are run from the `backend/` directory. They default to dry-run mode; `--apply` writes changes.

```bash
node src/scripts/migrateCustomAiKeys.js --dry-run
node src/scripts/migrateFollowData.js --dry-run
```

Before applying either migration:

1. Confirm the database URI points to the intended environment.
2. Take and verify a restorable database backup.
3. Review dry-run output and schedule an appropriate maintenance window.
4. Apply only the intended migration, then inspect logs and validate affected records.

```bash
node src/scripts/migrateCustomAiKeys.js --apply
node src/scripts/migrateFollowData.js --apply
```

Do not run both apply commands blindly. Keep the encryption key stable when migrating encrypted fields.

## Redis Degradation

When Redis is unavailable, the application may fall back to process-local memory for supported features. Check backend logs and Redis connectivity. This fallback can be acceptable for local or single-instance operation, but state is not shared between replicas and may be lost on restart. Restore Redis connectivity and verify cache, rate-limit, presence, and Socket.IO behavior before relying on horizontal scaling.

## Local Redis

From the repository root:

```bash
docker compose up -d redis
docker compose logs redis
docker compose down
```

The Compose file only runs Redis, binds it to loopback, and keeps data in a named volume. `docker compose down -v` also deletes that volume; use it only when intentionally discarding local Redis data.
