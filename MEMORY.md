# MEMORY.md

Running status log for this project, meant to be read at the start of a session instead of
re-deriving context from git history or re-exploring the codebase. Keep entries short — link to
`CLAUDE.md` (dev commands + architecture) and `docs/architecture.md` (full rationale) rather than
repeating their content here. Newest entry on top. Update this file whenever a session ends with
non-trivial state to hand off; skip the update for trivial/no-op sessions.

---

## 2026-09-16 — Docker actually built and run-tested; npm alternative added

**State:** Follow-up to the foundation build below. The Docker setup was previously only
hand-reviewed (no Docker binary in this environment); this session found Podman was available
and used it to genuinely build and run both container images.

**Done:**

- Built `Dockerfile` (Bun) and the new `Dockerfile.npm` (npm placeholder, for machines without
  Bun) with `podman build` — both succeeded.
- Ran each image against a real `postgres:16-alpine` container on a shared Podman network
  (manually replicating what `docker-compose.yml` does — no `docker compose`/`podman-compose`
  binary available to run the compose file directly). Verified for both images: `/health` → 200,
  `/ready` → 200 (live DB check from inside the container), process runs as non-root `appuser`,
  and `SIGTERM` triggers the same graceful shutdown sequence as bare-metal (HTTP server closed →
  Prisma disconnected → exit 0).
- Found and fixed a real bug: `Dockerfile.npm` on `node:20-alpine` failed — npm 10.8.2 hits an
  internal arborist crash (`Cannot read properties of null (reading 'edgesOut')`) resolving this
  project's dependency graph without a lockfile. Fixed by switching to `node:22-alpine` (npm
  10.9.x), confirmed with a rebuild.
- All test containers/images/networks cleaned up afterward — nothing left running.
- Updated `README.md` and `docs/architecture.md` §13 with the tested-not-just-reviewed status and
  the npm base-image pin rationale.

**Carry-forward:** `docker-compose.yml` itself (the actual compose file, not the manual
two-container equivalent) is still unexercised — worth an actual `docker compose up --build` (or
`podman compose`, if that tooling gets installed) next time Docker/compose tooling is available,
just to be thorough.

---

## 2026-09-16 — Foundation build complete

**State:** Infrastructure-only backend foundation built and validated. No business domain exists
yet (no auth routes, no students/teachers/etc). This is the base future feature work builds on.

**Done:**

- Full app skeleton (`src/app.js` + `src/server.js`), config layer, error handling, logging,
  Prisma client wiring, JWT/password utility foundations, ESLint/Prettier, Vitest + 4 passing
  tests, Docker (Dockerfile + docker-compose.yml), `.env`/`.env.example`, README,
  `docs/architecture.md`, `CLAUDE.md`.
- Validated for real: app boots against a real local Postgres, `/health` and `/ready` both work,
  graceful shutdown confirmed on both SIGTERM and SIGINT, lint/format/tests/prisma-generate all
  pass. Docker config validated by hand (YAML parse + Dockerfile review) — **not** built with a
  real `docker compose build`, since Docker isn't installed in this environment. Verify with a
  real build before depending on it in CI.
- Created a local `school_admin`/`school_management` Postgres role + DB matching `.env` defaults,
  for local dev without Docker.

**Deliberate deviations from a "standard" setup (see `docs/architecture.md` for why):**

- Prisma pinned to 6.19.3, not 7.x (7.x requires `prisma.config.ts` + driver adapters).
- No `asyncHandler` wrapper — Express 5 auto-forwards async rejections to `next()`.
- No repository layer — Controller → Service → Prisma directly.
- No rate limiting yet — nothing to scope it to until a real route exists.

**Next step / open decision:** database domain modeling (first real Prisma models) and/or the
first business module (likely auth) haven't been started — needs a scoping conversation before
implementation, see `docs/architecture.md` §15 for the specific open questions to resolve first.
