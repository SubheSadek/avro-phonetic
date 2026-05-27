# ----------------------------------------
# Variables
# ----------------------------------------
DC      = docker compose
SERVICE = avro-phonetic
PNPM    = pnpm

# ----------------------------------------
# Docker commands
# ----------------------------------------

# Run once before anything else — generates pnpm-lock.yaml via Docker
# (no local Node/pnpm required). Commit the lockfile afterwards.
.PHONY: init
init:
	@echo "🔄 Generating pnpm-lock.yaml via Docker..."
	docker run --rm \
	  -v "$(CURDIR):/app" \
	  -w /app \
	  node:24-alpine \
	  sh -c "corepack enable pnpm && pnpm install"
	@echo "✅ pnpm-lock.yaml generated!"
	@echo "👉 Next: git add pnpm-lock.yaml && git commit -m 'chore: add pnpm lockfile' && make build"

.PHONY: build
build:
	$(DC) build --no-cache

.PHONY: build-prod
build-prod:
	docker build --target release -t $(SERVICE):latest .

.PHONY: test-docker
test-docker:
	$(DC) run --rm test

.PHONY: down
down:
	$(DC) down --remove-orphans

.PHONY: sh
sh:
	$(DC) run --rm test sh

# ----------------------------------------
# PNPM commands
# ----------------------------------------
.PHONY: install
install:
	$(PNPM) install --frozen-lockfile

.PHONY: dev
dev:
	$(PNPM) run dev

.PHONY: compile
compile:
	$(PNPM) run build

.PHONY: clean
clean:
	$(PNPM) run clean

.PHONY: test
test:
	$(PNPM) run test

.PHONY: test-cov
test-cov:
	$(PNPM) run test:coverage

.PHONY: lint
lint:
	$(PNPM) run lint

.PHONY: lint-fix
lint-fix:
	$(PNPM) run lint:fix

.PHONY: fmt
fmt:
	$(PNPM) run format

.PHONY: fmt-check
fmt-check:
	$(PNPM) run format:check

.PHONY: typecheck
typecheck:
	$(PNPM) run typecheck

# ----------------------------------------
# Composite commands
# ----------------------------------------
.PHONY: check
check: typecheck lint fmt-check test-cov

.PHONY: release
release: clean compile
	@echo "✅ Build complete — dist/ is ready to publish"

.PHONY: publish
publish: check release
	$(PNPM) publish --access public

# ----------------------------------------
# Sync node_modules from container
# ----------------------------------------
.PHONY: sync
sync:
	@echo "🔄 Syncing node_modules from container..."
	docker compose cp $(SERVICE):/app/node_modules ./
	docker compose cp $(SERVICE):/app/.pnpm-store ./
	@echo "✅ Synced!"

# ----------------------------------------
# Version bumping
# ----------------------------------------
.PHONY: v-patch
v-patch:
	$(PNPM) version patch

v-minor:
	$(PNPM) version minor

v-major:
	$(PNPM) version major

# ----------------------------------------
# Helpers
# ----------------------------------------
.PHONY: pnpm
pnpm:
	$(PNPM) $(filter-out $@,$(MAKECMDGOALS))

# Catch-all: silently ignore extra words passed to passthrough targets
# (e.g. "make pnpm version patch" — 'version' and 'patch' become no-ops)
%:
	@:

.PHONY: help
help:
	@echo ""
	@echo "  avro-phonetic — available targets"
	@echo ""
	@echo "  Docker"
	@echo "    init         Generate pnpm-lock.yaml (run once, no local Node needed)"
	@echo "    build        Build all Docker images (no cache)"
	@echo "    build-prod   Build the release image"
	@echo "    test-docker  Run the full test suite inside Docker"
	@echo "    down         Stop and remove containers"
	@echo "    sh           Open a shell in the test container"
	@echo ""
	@echo "  pnpm"
	@echo "    install      pnpm install --frozen-lockfile"
	@echo "    dev          Start tsup in watch mode"
	@echo "    compile      Build dist/"
	@echo "    clean        Remove dist/"
	@echo "    test         Run unit tests"
	@echo "    test-cov     Run tests with coverage"
	@echo "    lint         ESLint"
	@echo "    lint-fix     ESLint --fix"
	@echo "    fmt          Prettier write"
	@echo "    fmt-check    Prettier check"
	@echo "    typecheck    tsc --noEmit"
	@echo ""
	@echo "  Version"
	@echo "    version-patch  Bump patch version (1.0.0 → 1.0.1)"
	@echo "    version-minor  Bump minor version (1.0.0 → 1.1.0)"
	@echo "    version-major  Bump major version (1.0.0 → 2.0.0)"
	@echo ""
	@echo "  Composite"
	@echo "    check        typecheck + lint + fmt-check + test (with coverage)"
	@echo "    release      clean + compile"
	@echo "    publish      check + release + pnpm publish"
	@echo "    sync         Copy node_modules from container to host"
	@echo ""
