# 🚀 How to Publish `avro-phonetic` to npm — Beginner's Guide

This guide walks you through **every single step** from zero to having your package live on npm, fully automated with Docker + GitHub Actions CI/CD.

---

## 📦 What Happens (Big Picture)

```
You push code to GitHub
       ↓
GitHub Actions runs CI (lint + tests + build) inside Docker
       ↓
You create a "Release" on GitHub
       ↓
GitHub Actions automatically publishes to npm 🎉
```

Your project already has all the config files ready. You just need to **connect the accounts** and **trigger a release**.

---

## ✅ Prerequisites Checklist

Before you start, make sure you have:

- [ ] A [GitHub](https://github.com) account
- [ ] Your project pushed to a GitHub repository
- [ ] [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed (for local testing)
- [ ] [Node.js 22+](https://nodejs.org) and [pnpm](https://pnpm.io) installed locally

---

## STEP 1 — Create an npm Account

1. Go to [https://www.npmjs.com](https://www.npmjs.com) and click **Sign Up**
2. Choose a username (this will appear on your package page, e.g. `npmjs.com/~yourusername`)
3. Verify your email address

> **Why?** npm is the registry where your package lives. Anyone who runs `npm install avro-phonetic` downloads it from here.

---

## STEP 2 — Generate an npm Access Token

This is the "password" that lets GitHub publish to npm on your behalf — you never share your real password.

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click your **profile picture** (top right) → **Access Tokens**
3. Click **Generate New Token** → choose **Classic Token**
4. Give it a name like `github-actions-avro-phonetic`
5. Choose type: **Automation** (this skips 2FA prompts in CI)
6. Click **Generate Token**
7. **Copy the token immediately** — you won't see it again!

> ⚠️ **Security:** Never paste this token in your code, commits, or chat. It's like a password.

---

## STEP 3 — Add the Token to GitHub Secrets

GitHub Secrets let your CI/CD workflow use the token securely without it appearing in your code.

1. Go to your GitHub repository
2. Click **Settings** tab (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name:** `NPM_TOKEN`  ← must be exactly this
   - **Secret:** paste your npm token here
6. Click **Add secret**

> Your `publish.yml` workflow already reads `${{ secrets.NPM_TOKEN }}` — so you just need to set it once, and it works automatically forever.

---

## STEP 4 — Push Your Code to GitHub

If you haven't pushed to GitHub yet, do this now in your terminal:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Connect to your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/avro-phonetic.git
git branch -M main
git push -u origin main
```

> After pushing, GitHub Actions will **automatically run CI** (the `ci.yml` workflow). Go to your repo → **Actions** tab to watch it run.

---

## STEP 5 — Understand Your CI Pipeline (Docker Inside!)

When you push to `main`, GitHub Actions runs `.github/workflows/ci.yml`, which does this:

```
Step 1: Quality Check
  ↳ TypeScript typecheck (tsc --noEmit)
  ↳ ESLint (code quality)
  ↳ Prettier (code formatting)

Step 2: Tests (on Node 22 AND Node 24)
  ↳ vitest (unit tests)
  ↳ uploads coverage to Codecov

Step 3: Build
  ↳ tsup compiles TypeScript → dist/
  ↳ verifies CJS and ESM outputs work
```

Your **Dockerfile** powers local Docker usage. The **GitHub Actions** runner is a virtual Linux machine that does the same steps — just without Docker overhead.

### Test locally with Docker before pushing:

```bash
# Run full test suite inside Docker
docker compose run --rm test

# Build the dist/ folder inside Docker
docker compose run --rm build
```

If these pass locally, CI will pass too. ✅

---

## STEP 6 — Bump the Version Before Publishing

npm requires each published version to be unique. You need to update the version in `package.json`.

Follow [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`

| Change type | Example | When to use |
|---|---|---|
| Bug fix | `1.0.0` → `1.0.1` | Small fix, nothing breaks |
| New feature | `1.0.0` → `1.1.0` | Added something new |
| Breaking change | `1.0.0` → `2.0.0` | Old code won't work anymore |

Use pnpm to bump the version automatically:

```bash
# For a bug fix:
pnpm version patch

# For a new feature:
pnpm version minor

# For a breaking change:
pnpm version major
```

This updates `package.json` **and** creates a git tag (e.g., `v1.0.1`).

Then push the new version and tag:

```bash
git push origin main --tags
```

---

## STEP 7 — Create a GitHub Release (This Triggers Publishing!)

This is the magic step. Your `publish.yml` workflow **only runs when you create a GitHub Release**.

1. Go to your GitHub repository
2. Click **Releases** (right sidebar) → **Create a new release**
3. Click **Choose a tag** → select the tag you just pushed (e.g., `v1.0.1`)
4. Fill in:
   - **Release title:** `v1.0.1` (or something descriptive like `v1.0.1 — Bug fixes`)
   - **Description:** What changed in this version (check your `CHANGELOG.md`)
5. Click **Publish release**

> 🎉 This triggers `publish.yml` automatically! Go to **Actions** tab to watch it publish.

---

## STEP 8 — What `publish.yml` Does (Behind the Scenes)

When the release is created, GitHub Actions:

```
1. Checks out your code
2. Installs pnpm + Node.js 24
3. Installs dependencies (pnpm install --frozen-lockfile)
4. Runs tests (pnpm test) — safety net!
5. Builds the package (pnpm build → dist/)
6. Checks: does the git tag match package.json version?
   → If v1.0.1 tag ≠ "1.0.1" in package.json, it FAILS (prevents mistakes)
7. Publishes to npm with provenance attestation
   (provenance = cryptographic proof linking the package to this exact GitHub run)
```

---

## STEP 9 — Verify Your Package is Live

After the workflow finishes:

1. Visit `https://www.npmjs.com/package/avro-phonetic`
2. You should see your package listed! 🎉

Test that it installs correctly:

```bash
# In a NEW, empty folder:
mkdir test-avro && cd test-avro
npm install avro-phonetic
node -e "const { parse } = require('avro-phonetic'); console.log(parse('ami'));"
```

---

## 🔄 The Full Workflow — Every Future Release

Once set up, your workflow for every future version is just **4 commands + 1 GitHub click**:

```bash
# 1. Make your changes, then commit
git add .
git commit -m "feat: add new feature"

# 2. Bump the version (creates tag automatically)
pnpm version minor   # or patch / major

# 3. Push code + tag to GitHub
git push origin main --tags

# 4. Go to GitHub → Releases → Create release → Pick tag → Publish
```

CI runs automatically on push. Publishing happens when you create the release.

---

## 🐳 Docker's Role — Summary

| Where | What Docker does |
|---|---|
| **Your computer** | `docker compose run --rm test` — test locally without installing anything globally |
| **Your computer** | `docker compose run --rm build` — build `dist/` inside a clean container |
| **GitHub Actions** | The CI uses a Linux VM directly (no Docker needed) — same steps, same result |

Docker ensures: **"It works on my machine" = "It works everywhere"** ✅

---

## ❓ Common Problems & Solutions

**"Tag does not match package.json version"**
→ You forgot to run `pnpm version patch/minor/major` before creating the release. Or you created the release with the wrong tag. Make sure the tag (`v1.0.1`) matches the version in `package.json` (`"version": "1.0.1"`).

**"403 Forbidden" from npm during publish**
→ Your `NPM_TOKEN` secret is wrong or expired. Go to npmjs.com → generate a new token → update the GitHub secret.

**"Package name already taken" on npm**
→ The name `avro-phonetic` might be taken. Check npmjs.com. If taken, update the `"name"` field in `package.json` to something unique like `@yourusername/avro-phonetic` (a scoped package).

**CI fails on lint/format**
→ Run `pnpm run lint:fix && pnpm run format` locally, then commit and push again.

**Tests fail in CI but pass locally**
→ Run `docker compose run --rm test` locally — this uses the exact same environment as CI.

---

## 📚 Quick Reference — Important Files

| File | What it does |
|---|---|
| `package.json` | Package name, version, scripts, dependencies |
| `Dockerfile` | Multi-stage build: base → deps → build → test → release |
| `compose.yml` | Local Docker shortcuts: `test` and `build` services |
| `.github/workflows/ci.yml` | Auto-runs on every push: lint + test + build |
| `.github/workflows/publish.yml` | Auto-runs on GitHub Release: publishes to npm |
| `.npmignore` | Files excluded from the npm package |
| `tsup.config.ts` | TypeScript build config (outputs CJS + ESM + types) |

---

*Happy publishing! 🎉 If anything breaks, check the **Actions** tab on GitHub for detailed error logs.*
