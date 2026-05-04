## Title

feat(deploy): add GitHub Actions CI/CD workflow for Sakura Cloud VPS

## Summary

This PR introduces an automated deployment pipeline that triggers on every push
to `main`. It builds both the Vite frontend and the esbuild-compiled ESM backend,
runs unit-test gates for both sides, syncs build artifacts to a Sakura Cloud VPS
via rsync over SSH, takes a `mysqldump` backup before running DB migrations, then
reloads the backend process under pm2.

A code review was performed after the initial commit and six security/quality
issues were resolved before this PR was opened (see **Notes** for details).

## Related Tasks

TBD — no linked issue at the time of writing.

## What was done

### `.github/workflows/deploy.yml` (new)

- Single `deploy` job; triggers on `push` to `main`; timeout set to 20 minutes.
- **Test gate** — runs `npm test` (frontend) and `npm run test:unit` (backend)
  before any artifact is produced or transferred. The deploy is aborted if either
  test suite fails.
- **Frontend build** — `npm ci` + `npm run build` (Vite) in `frontend/`.
- **Backend build** — `npm ci` + `npm run build` (esbuild) in `backend/`;
  outputs `dist/server.mjs` and `dist/infrastructure/migrate.mjs` as ESM bundles.
- **SSH hardening** — uses `webfactory/ssh-agent@v0.9.0`; server host key is
  read from the pinned `SAKURA_KNOWN_HOST` secret rather than from a live
  `ssh-keyscan` call (MITM prevention).
- **Secret isolation** — all `${{ secrets.* }}` references are assigned to `env:`
  blocks and consumed as plain environment variables inside `run:` steps, keeping
  them out of shell argument lists.
- **rsync transfers** — frontend `dist/` → `DEPLOY_PATH/frontend/`;
  backend `dist/`, `migrations/`, `package.json`, `package-lock.json`, and
  `ecosystem.config.cjs` → `DEPLOY_PATH/backend/`.
- **DB backup** — `mysqldump` writes a timestamped `.sql` file to
  `/var/backups/` before migrations run.
- **DB migration** — `node dist/infrastructure/migrate.mjs` runs on the server
  after the backup.
- **pm2 reload** — `pm2 reload tdd-todo-app --update-env` if the process already
  exists; `pm2 start ecosystem.config.cjs` on first deploy; followed by
  `pm2 save`.

### `backend/ecosystem.config.cjs` (new)

- pm2 app name: `tdd-todo-app`; script: `./dist/server.mjs`.
- `cwd` and `--env-file` path are set to `/var/www/tdd-todo-app/backend` and
  documented with coupling comments pointing back to `deploy.yml`'s
  `DEPLOY_PATH`.
- `NODE_ENV: 'production'` set explicitly in the `env` block so pm2 never starts
  the process with an undefined `NODE_ENV`.
- Server prerequisites documented in the file header (Node 20+, pm2, MySQL,
  `.env`, pm2 startup hook).

### `backend/package.json` (modified)

- Added `build`, `build:server`, and `build:migrate` scripts using esbuild
  (`--bundle --platform=node --packages=external --format=esm`).
- Added `esbuild` as a devDependency.
- Moved `eslint-plugin-unused-imports` from `dependencies` to `devDependencies`
  (it was incorrectly classified as a runtime dependency).

### `backend/.gitignore` (modified)

- Added `dist/` so compiled ESM output is not tracked by git.

## What is not included

- **Nginx configuration** — static file serving and reverse-proxy setup for the
  VPS are one-time manual steps and are not automated by this workflow.
- **Integration-test gate** — integration tests require a live MySQL instance
  that is not available in the GitHub Actions runner; only unit tests are run as
  the deploy gate.
- **Rollback automation** — the `mysqldump` backup is created but no automated
  rollback step exists; restoring from backup is a manual operation.
- **Staging environment** — there is no separate staging workflow; only `main` →
  production is covered.
- **Slack / notification hooks** — no failure notifications are wired up.

## Impact

- **Deployment process** — pushes to `main` now trigger a fully automated build
  and deploy; manual SSH-and-rsync steps are no longer required.
- **backend `dependencies`** — `eslint-plugin-unused-imports` is removed from
  the production install graph; `npm ci --omit=dev` on the server will no longer
  download it.
- **pm2 process name** — the canonical process name is now `tdd-todo-app`; any
  existing pm2 process with a different name will not be reloaded automatically
  on first deploy.
- **`DEPLOY_PATH` coupling** — `ecosystem.config.cjs` hard-codes
  `/var/www/tdd-todo-app/backend`; both `deploy.yml` and `ecosystem.config.cjs`
  must be updated together if the deployment path changes.

## Testing

- Unit tests for both frontend and backend pass as part of the workflow's test
  gate (verified locally before commit).
- The deploy workflow itself has not been executed against a live Sakura Cloud
  VPS as part of this PR; end-to-end verification will occur on the first push to
  `main` after merge.
- Code review findings (see `review/deploy-workflow-sakura-vps-20260504.md`)
  were all addressed before this PR was drafted.

## Notes

### Required GitHub Secrets

The following secrets must be configured in the repository's **production**
environment before the workflow can run:

| Secret name | How to obtain |
|---|---|
| `SAKURA_SSH_PRIVATE_KEY` | Ed25519 or RSA private key; corresponding public key added to server's `~/.ssh/authorized_keys` |
| `SAKURA_HOST` | Server IP address or hostname |
| `SAKURA_USER` | SSH username |
| `SAKURA_KNOWN_HOST` | Run `ssh-keyscan -H <server-ip>` from a **trusted network** once, then store the output |

### Server prerequisites (one-time manual setup)

1. Node.js 20+, npm, pm2 (`npm install -g pm2`) installed on the VPS.
2. MySQL running; database `TDDTodoAppDB` created.
3. `/var/www/tdd-todo-app/backend/.env` populated from `.env.example`.
4. `/var/www/tdd-todo-app/backend/.my.cnf` containing MySQL credentials for
   `mysqldump` (mode `0600`).
5. pm2 startup hook configured: `pm2 startup && pm2 save`.

### Security hardening applied (post-review)

The following six issues were fixed after the initial `feat` commit and before
this PR was opened, as documented in
`review/deploy-workflow-sakura-vps-20260504.md`:

1. `ssh-keyscan` replaced with pinned `SAKURA_KNOWN_HOST` secret.
2. Inline test gate added before any build or transfer step.
3. `mysqldump` backup added before DB migration.
4. All `${{ secrets.* }}` references moved to `env:` blocks.
5. `eslint-plugin-unused-imports` moved to `devDependencies`.
6. `NODE_ENV=production` set explicitly in `ecosystem.config.cjs`.
