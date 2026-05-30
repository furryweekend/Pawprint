# Contributing to Pawprint

Thanks for your interest in contributing!

## Getting Started

1. Fork and clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.dev.vars` file for local secrets:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:8787`.

## Project Structure

```
src/           TypeScript source (Workers runtime)
public/        Static assets (admin panel HTML/CSS/JS, analytics dashboard)
test/          Vitest tests using Cloudflare Workers test pool
migrations/    D1 database migrations
```

## Before Submitting a PR

Every pull request must pass two checks in CI:

1. **Tests** — run locally with:
   ```bash
   npx vitest run
   ```
   This runs automatically via GitHub Actions on every PR.

2. **Cloudflare Workers build** — the [Cloudflare Workers and Pages](https://github.com/apps/cloudflare-workers-and-pages) GitHub app builds and deploys a preview for every PR. If the Worker fails to compile, this check will fail.

Your PR will not be merged if either check fails.

## Writing Tests

Tests use [`@cloudflare/vitest-pool-workers`](https://developers.cloudflare.com/workers/testing/vitest-integration/) to run against a local Workers runtime. Test files go in `test/` and have access to the full Workers environment (D1, KV, etc.).

The test auth password is read from `.dev.vars` — make sure that file exists locally (see Getting Started above).

## Code Style

- Follow the existing conventions in the codebase
- Keep comments minimal — the code should be self-explanatory
- TypeScript source lives in `src/`, static frontend files in `public/`
- Admin panel logic is split across `admin.html`, `admin.css`, and `admin.js`
