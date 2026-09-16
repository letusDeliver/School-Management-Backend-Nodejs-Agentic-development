# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repo is currently an **infrastructure-only foundation** for a School Management System
backend — no business domain (students, teachers, classes, attendance, fees, auth routes, etc.)
has been implemented yet. Do not add business endpoints/controllers/modules unless explicitly
asked; see `docs/architecture.md` §14 for what is intentionally out of scope and §15 for open
decisions to raise before starting the first real module.

## Commands

Package manager is **Bun** (`bun.lock` is the lockfile — don't introduce npm/yarn/pnpm lockfiles).

```bash
bun install                      # install dependencies
bun run dev                      # start with nodemon (auto-restart on src/ or .env changes)
bun run start                    # start once, production-style

bun run lint                     # ESLint (flat config, eslint.config.js)
bun run lint:fix
bun run format                   # Prettier write
bun run format:check             # Prettier check (used in CI)

bun run test                     # vitest run — full suite once
bun run test:watch               # vitest watch mode
bun run test:coverage            # vitest run --coverage
bun run test tests/unit/api-error.test.js   # single file
bunx vitest run -t "name substring"         # single test by name

bun run db:generate              # regenerate Prisma client after schema changes
bun run db:migrate               # create/apply a dev migration
bun run db:migrate:deploy        # apply migrations (production/CI)
bun run db:push                  # push schema without a migration (prototyping)
bun run db:studio                # Prisma Studio

docker compose up --build        # backend + postgres containers
```

Environment variables are validated with Zod at startup (`src/config/env.js`) and the process
exits immediately with a readable error list if any are missing/invalid — copy `.env.example` to
`.env` before running anything. `vitest.config.js` injects its own env values via `test.env`, so
tests don't need a `.env` file.

## Architecture

### app.js / server.js split

`src/app.js` exports `createApp()`, a factory that builds and configures the Express app
(middleware, routes, error handling) with no knowledge of ports or process lifecycle — this is
what lets `tests/integration/*.test.js` exercise it via Supertest without binding a socket.
`src/server.js` owns the running process: connects the DB, starts listening, and handles
`SIGTERM`/`SIGINT`/`uncaughtException`/`unhandledRejection` with a graceful shutdown (drain HTTP
server → disconnect Prisma → exit).

### Configuration flow

Nothing outside `src/config/env.js` reads `process.env` directly. Every other config module
(`logger.js`, `cors.js`, `database.js`, `cloudinary.js`) consumes the already-validated `env`
object exported from `env.js` and exposes a ready-to-use value. Follow this pattern for any new
config rather than reading `process.env` in a new spot.

### Middleware order (`src/app.js`)

```
request-id → helmet → cors → pino-http → body parsers (1mb limit) → routes → 404 → error handler
```

`/health` and `/ready` are the only routes today (infra-level; `/ready` checks Prisma
connectivity). Future feature routers get mounted after them, before the 404 handler.

### Error handling

Throw `ApiError` (`src/utils/api-error.js`; use its static helpers like `ApiError.notFound()`,
`.validation()`, `.forbidden()`) for any intentional/operational error. Everything — `ApiError`,
`ZodError`, `http-errors` instances — funnels through the single global handler in
`src/middlewares/error.middleware.js`, which normalizes it into `{ success: false, error: { code,
message, details? } }` and sanitizes 5xx messages when `NODE_ENV=production`. There is **no
`asyncHandler` wrapper** — Express 5 (installed here) auto-forwards rejected promises from async
route handlers to `next()`, so don't add one back.

### Database

One Prisma client instance only: `src/lib/prisma.js` (cached on `globalThis` outside production
to survive nodemon reloads). Never instantiate `PrismaClient` elsewhere. `prisma/schema.prisma`
currently has only `datasource`/`generator` blocks — no models — by design; the domain model is a
separate, not-yet-started task. Prisma is deliberately pinned to the 6.x line (not 7.x, which
requires `prisma.config.ts` + driver adapters) — see `docs/architecture.md` §3 before upgrading.

### Future module layout

New business features go under `src/modules/<feature>/` as self-contained units:
`*.routes.js`, `*.controller.js`, `*.service.js`, `*.schema.js` (Zod), `*.constants.js`. The
chosen layering is **Controller → Service → Prisma directly — no repository layer** (Prisma's
client already is the data-access abstraction; see `docs/architecture.md` §12 for the reasoning
before adding one).

### Auth/security primitives (not wired to routes yet)

`src/utils/jwt.js` (separate access/refresh secrets, `signAccessToken`/`verifyAccessToken`/etc.)
and `src/utils/password.js` (bcryptjs, cost factor 12) exist for a future auth module to consume
— there are no login/signup routes yet. CORS is an explicit env-driven allowlist
(`src/config/cors.js`, `CORS_ORIGIN`), not `cors()` wide open; unknown origins get a `403`, not a
silent block. Rate limiting was deliberately not added — introduce it scoped to the first
rate-sensitive route (e.g. login) rather than as generic middleware now.

### Response contract (convention, not yet enforced by a helper)

```json
// success
{ "success": true, "data": {}, "message": "..." }
// failure (already implemented by error.middleware.js)
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

For the full rationale behind every decision above (including alternatives considered and
rejected), see `docs/architecture.md`.
