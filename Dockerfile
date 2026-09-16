# syntax=docker/dockerfile:1

FROM oven/bun:1.4-alpine AS base
WORKDIR /app

# --- dependencies (cached separately from source for faster rebuilds) ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- prisma client generation (needs dev deps + schema) ---
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY prisma ./prisma
RUN bunx prisma generate
COPY src ./src

# --- runtime image ---
FROM base AS runtime
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./
COPY prisma ./prisma
COPY src ./src

USER appuser

EXPOSE 5000

CMD ["bun", "run", "src/server.js"]
