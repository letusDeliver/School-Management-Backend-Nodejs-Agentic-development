# MEMORY.md

Running status log for this project, meant to be read at the start of a session instead of
re-deriving context from git history or re-exploring the codebase. Keep entries short — link to
`CLAUDE.md` (dev commands + architecture) and `docs/architecture.md` (full rationale) rather than
repeating their content here. Newest entry on top. Update this file whenever a session ends with
non-trivial state to hand off; skip the update for trivial/no-op sessions.

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
