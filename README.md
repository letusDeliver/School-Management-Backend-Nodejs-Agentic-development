# School Management Backend

Backend foundation for a School Management System (SMS). This repository currently contains
**only infrastructure** — application bootstrap, security, configuration, database, logging,
error handling, testing and deployment scaffolding. No business domain (students, teachers,
classes, attendance, fees, ...) has been implemented yet; see
[`docs/architecture.md`](docs/architecture.md) for the plan and the decisions already made.

## Tech Stack

| Concern         | Choice                          |
| --------------- | ------------------------------- |
| Runtime         | Node.js (ES Modules)            |
| Package manager | [Bun](https://bun.sh)           |
| Web framework   | Express 5                       |
| Database        | PostgreSQL                      |
| ORM             | Prisma (`prisma` 6.x)           |
| Validation      | Zod                             |
| Auth primitives | jsonwebtoken, bcryptjs          |
| Media storage   | Cloudinary (configured, unused) |
| Logging         | Pino / pino-http                |
| Testing         | Vitest + Supertest              |
| Lint / format   | ESLint (flat config) + Prettier |

## Prerequisites

- Node.js >= 20
- [Bun](https://bun.sh) (package manager and script runner for this project)
- PostgreSQL 16 (locally installed, or via the provided `docker-compose.yml`)

## Getting Started

```bash
bun install
cp .env.example .env   # then fill in the values described below
bun run db:generate
bun run db:push        # or: bun run db:migrate (once real migrations exist)
bun run dev
```

The server starts on `http://localhost:5000` (configurable via `PORT`).

## Environment Variables

All environment variables are validated at startup with Zod
([`src/config/env.js`](src/config/env.js)); the process refuses to start if any are missing or
invalid. See [`.env.example`](.env.example) for the full list and safe placeholder values.

| Variable                 | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `NODE_ENV`               | `development` \| `test` \| `production`                     |
| `PORT`                   | HTTP port                                                   |
| `DATABASE_URL`           | PostgreSQL connection string used by Prisma                 |
| `JWT_ACCESS_SECRET`      | Signing secret for short-lived access tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime (e.g. `15m`)                          |
| `JWT_REFRESH_SECRET`     | Signing secret for long-lived refresh tokens (min 32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`)                          |
| `CORS_ORIGIN`            | Comma-separated list of allowed origins                     |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary account (optional until upload features exist)   |
| `CLOUDINARY_API_KEY`     | Cloudinary API key (optional)                               |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret (optional)                            |
| `LOG_LEVEL`              | Pino log level (`info`, `debug`, ...)                       |

## Database

The Prisma schema ([`prisma/schema.prisma`](prisma/schema.prisma)) intentionally has **no
business models yet** — only the `datasource`/`generator` configuration. The database domain
model will be designed as its own task.

```bash
bun run db:generate   # regenerate the Prisma client after schema changes
bun run db:migrate    # create/apply a dev migration
bun run db:push       # push schema changes without creating a migration (prototyping)
bun run db:studio     # open Prisma Studio
```

A single, centralized Prisma client lives at [`src/lib/prisma.js`](src/lib/prisma.js) — nothing
else in the codebase should instantiate `PrismaClient` directly.

## Development Commands

```bash
bun run dev             # start with nodemon (auto-restart)
bun run start           # start once, production-style
bun run lint            # ESLint
bun run lint:fix        # ESLint with autofix
bun run format          # Prettier write
bun run format:check    # Prettier check (CI)
bun run test            # run the test suite once
bun run test:watch      # watch mode
bun run test:coverage   # with coverage report
```

## Testing

[Vitest](https://vitest.dev) is used over Jest — it runs ESM natively with no transpilation
config, starts noticeably faster, and its API is Jest-compatible so contributors need no
ramp-up. Tests live under `tests/unit` and `tests/integration`; `vitest.config.js` injects the
environment variables needed to satisfy env validation without requiring a `.env` file in CI.

## Docker

```bash
docker compose up --build
```

This starts two services: `postgres` (with a persistent volume and health check) and `backend`
(built from the provided multi-stage `Dockerfile`, using Bun, running as a non-root user).
Cloudinary is an external service and is never containerized.

Both the `Dockerfile` (Bun) and `docker-compose.yml` have been build-and-run tested (with
Podman, Docker-CLI-compatible): image build, container boot against a real Postgres container,
`/health` and `/ready` both healthy, non-root user confirmed, and graceful shutdown on `SIGTERM`
confirmed (HTTP server closed → Prisma disconnected → clean exit).

### Building with npm instead of Bun

[`Dockerfile.npm`](Dockerfile.npm) is a placeholder/example for building the same image with
npm — useful on a machine that has Docker but not Bun (e.g. a Windows box). It is not the
project's canonical build (that stays Bun-based); no `package-lock.json` is committed, so it
runs `npm install` rather than `npm ci`. It has also been build-and-run tested the same way as
above. It is pinned to `node:22-alpine` rather than `node:20-alpine` — npm 10.8.2 (bundled with
`node:20-alpine` at the time this was written) fails on this project's dependency graph with an
internal arborist error when installing without a lockfile; npm 10.9.x (`node:22-alpine`) does
not have this problem.

```bash
docker build -f Dockerfile.npm -t school-backend .
docker run --env-file .env -p 5000:5000 school-backend
```

## Project Structure

See [`docs/architecture.md`](docs/architecture.md) for the full rationale. Summary:

```text
src/
  app.js            Express app: middleware, infra routes, error handling
  server.js         Process lifecycle: listen, graceful shutdown, signal handling
  config/           env, logger, cors, database, cloudinary — all env-driven
  constants/        Infrastructure-level constants (HTTP status codes)
  middlewares/      request-id, 404, centralized error handler
  utils/            ApiError, JWT helpers, password hashing helpers
  lib/              Singleton clients (Prisma)
  modules/          Empty — future feature modules (students, teachers, ...) go here
prisma/             schema.prisma (no models yet), migrations/
tests/
  unit/             Pure logic (ApiError, ...)
  integration/      Supertest against the Express app
```

## What's Deliberately Not Here Yet

Authentication endpoints, RBAC, and every business domain (students, teachers, classes,
attendance, exams, fees, transport, notifications, ...) are out of scope for this task. The
foundation is designed so those can be added as self-contained modules under `src/modules/`
without restructuring anything above.
