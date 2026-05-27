# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────
# avro-phonetic — multi-stage Docker build (pnpm via corepack)
# ──────────────────────────────────────────────────────────────

# ── base: Node + pnpm ─────────────────────────────────────────
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# corepack ships with Node ≥ 16; enable pnpm without a global install
RUN corepack enable pnpm
WORKDIR /app

# ── deps: install dependencies (cached layer) ─────────────────
FROM base AS deps
# pnpm-workspace.yaml must be present — pnpm 11 reads allowBuilds from it
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Mount the pnpm content-addressable store for layer caching
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── build: compile TypeScript → dist/ ─────────────────────────
FROM deps AS build
COPY . .
RUN pnpm run build

# ── test: typecheck + lint + unit tests ───────────────────────
FROM deps AS test
COPY . .
RUN pnpm run typecheck
RUN pnpm run lint
RUN pnpm run format:check
RUN pnpm run test

# ── release: minimal production image (dist only) ─────────────
FROM node:24-alpine AS release
WORKDIR /app
# Copy only the compiled artefacts and publishing-required files
COPY --from=build /app/dist          ./dist
COPY --from=build /app/package.json  ./package.json
COPY --from=build /app/README.md     ./README.md
COPY --from=build /app/LICENSE       ./LICENSE
COPY --from=build /app/CHANGELOG.md  ./CHANGELOG.md
USER node
