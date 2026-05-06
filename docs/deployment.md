# Cloudflare deployment

## Required GitHub secrets

Configure these repository secrets before enabling production deployments:

- `CLOUDFLARE_API_TOKEN`: In the Cloudflare dashboard, open **My Profile** -> **API Tokens** and create a token. For this repository, grant access needed for Pages deployments now and Workers deployments later.
- `CLOUDFLARE_ACCOUNT_ID`: In the Cloudflare dashboard, copy the Account ID shown in the right sidebar.

## Frontend: Cloudflare Pages

The frontend is configured for Cloudflare Pages with `frontend/wrangler.jsonc` and `.github/workflows/deploy-frontend.yml`.

### Initial setup

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages**.
3. Create a **Pages** project named `tdd-todo-app-frontend`.
4. Complete the one-time project creation flow so the GitHub Actions deploy can target the existing project.
5. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to the GitHub repository secrets.

### Automated deploy flow

- Trigger: push to `main`
- Path filters: `frontend/**` or `.github/workflows/**`
- Steps run by GitHub Actions:
  1. Install frontend dependencies with `npm ci`
  2. Build with `npm run build`
  3. Deploy `frontend/dist` with `cloudflare/pages-action@v1`

## Backend: Cloudflare Workers

A full Workers deployment is **not enabled yet**.

The current backend runtime uses:

- `@hono/node-server` for the Node.js server bootstrap
- `mysql2` and direct TCP database access
- Node-style environment variable loading for database credentials

That stack is not ready for a safe Cloudflare Workers deployment without changing the runtime and database integration.

### Current repository status

- `.github/workflows/deploy-backend.yml` is a placeholder workflow with TODO notes.
- No backend `wrangler.jsonc` has been added yet.
- No Workers entrypoint has been added yet.

### What is needed before enabling Workers deploys

1. Replace the current `mysql2` TCP access with a Workers-compatible option such as Hyperdrive, D1, or an HTTP-accessible backend.
2. Split the Hono app export from the Node server bootstrap so Workers can import the app directly.
3. Add `backend/wrangler.jsonc` and a Workers entrypoint such as `backend/src/worker.ts`.
4. Update `deploy-backend.yml` to run `cloudflare/wrangler-action@v3`.

## First deployment checklist

1. Create the Cloudflare Pages project `tdd-todo-app-frontend`.
2. Add the two GitHub secrets.
3. Merge or push a change to `main` that touches `frontend/` or `.github/workflows/`.
4. Confirm the `Deploy frontend to Cloudflare Pages` workflow succeeds.
5. Open the deployed Pages URL in Cloudflare and verify the site loads.
