## Review Target

Commit `22f3dc8` — `feat: add GitHub Actions deploy workflow for Sakura Cloud VPS`

Changed files:
- `.github/workflows/deploy.yml` (new)
- `backend/ecosystem.config.cjs` (new)
- `backend/package.json` (modified)
- `backend/package-lock.json` (modified)
- `backend/.gitignore` (modified)

## Summary

The workflow is well-structured overall — correct ordering (build → deploy → migrate → restart), use of `environment: production`, heredoc quoting for the remote restart block, and idempotent migration logic. However, four issues need attention before this is production-safe: an SSH TOFU security hole, no test gate protecting production, automated migration with no data backup, and a misplaced ESLint plugin in `dependencies` that will be installed on the production server.

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
`ssh-keyscan` with no fingerprint verification is vulnerable to MITM**

Line 59:
```yaml
- name: Add server to known_hosts
  run: ssh-keyscan -H ${{ secrets.SAKURA_HOST }} >> ~/.ssh/known_hosts
```

`ssh-keyscan` blindly adds whatever key the server returns. An attacker who can intercept the TCP connection (DNS hijack, BGP leak, or a compromised upstream) will have their key trusted for every subsequent `ssh` and `rsync` call in the same job — including the `npm ci --omit=dev` remote shell and the `pm2 reload` step. This is the classic Trust On First Use (TOFU) problem.

**Fix:** Store the server's known public key in a GitHub Secret (`SAKURA_KNOWN_HOST`) and echo it directly instead of scanning:

```yaml
- name: Add server to known_hosts
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SAKURA_KNOWN_HOST }}" >> ~/.ssh/known_hosts
```

Obtain the value once with `ssh-keyscan -H <server>` from a trusted network and store it as a secret. This pins the key and eliminates the TOFU window on every deploy run.

Useful? React with 👍 / 👎.

Fixed. Replaced the `ssh-keyscan` step with an `echo` of a new `SAKURA_KNOWN_HOST` secret into `~/.ssh/known_hosts`. The comment block at the top of `deploy.yml` now documents how to obtain the value once from a trusted network (`ssh-keyscan -H <server>`). Commit: `fix(deploy): pin host key, add test gate, env-isolate secrets, backup DB`.

**Disposition:** fixed — `.github/workflows/deploy.yml`

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
No test gate — broken code can reach production**

The workflow goes directly from `npm run build` to SSH deployment with no step that runs the test suite. A commit that breaks unit or integration tests will still be deployed, potentially taking production down.

**Fix:** Add a test step between build and SSH setup:

```yaml
- name: Run backend tests
  working-directory: backend
  run: npm test

- name: Run frontend tests
  working-directory: frontend
  run: npm test
```

Alternatively, gate the `deploy` job on the existing `backend.yaml` / `frontend.yaml` CI jobs using `needs:`, so a test failure in CI already blocks the deploy job before it starts.

Useful? React with 👍 / 👎.

Fixed. Added a `Run frontend tests` step (`npm test`) after frontend install and a `Run backend unit tests` step (`npm run test:unit`) after backend install. Cross-workflow `needs:` is not possible in GitHub Actions (jobs can only depend on jobs in the same workflow file), so the test steps are inline. Integration tests are intentionally excluded from the deploy workflow because they require a live MySQL instance which is not available in the deploy runner; unit tests are sufficient as a gate. Commit: `fix(deploy): pin host key, add test gate, env-isolate secrets, backup DB`.

**Disposition:** fixed — `.github/workflows/deploy.yml`

---

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>
Automatic migration runs against production DB with no prior backup**

Lines 95–98:
```yaml
- name: Run database migrations
  run: |
    ssh ${{ secrets.SAKURA_USER }}@${{ secrets.SAKURA_HOST }} \
      "cd ${{ env.DEPLOY_PATH }}/backend && node dist/infrastructure/migrate.mjs"
```

Migrations are irreversible DDL statements (ALTER TABLE, DROP INDEX, etc.). The current `migrate.ts` uses `multipleStatements: true` and executes raw SQL files directly. If a migration contains a `DROP` or a destructive `ALTER` and it is applied incorrectly, data is permanently lost. There is no rollback and no backup taken before the migration runs.

**Fix (minimum viable):** Add a `mysqldump` step before the migration step and store the dump to a dated file:

```yaml
- name: Backup database before migration
  run: |
    ssh ${{ secrets.SAKURA_USER }}@${{ secrets.SAKURA_HOST }} \
      "mysqldump --defaults-file=/var/www/tdd-todo-app/backend/.my.cnf \
        TDDTodoAppDB > /var/backups/tdd-todo-app-\$(date +%Y%m%d%H%M%S).sql"
```

As a longer-term fix, consider requiring `--force-migrate` to be passed explicitly rather than always running migrations automatically on every push.

Useful? React with 👍 / 👎.

Fixed. Added a `Backup database before migration` step that runs `mysqldump --defaults-file=<DEPLOY_PATH>/backend/.my.cnf TDDTodoAppDB` into a timestamped file under `/var/backups/` before the migration step executes. The `SSH_USER`/`SSH_HOST` env vars introduced by the secrets-isolation fix are also applied here. Commit: `fix(deploy): pin host key, add test gate, env-isolate secrets, backup DB`.

**Disposition:** fixed — `.github/workflows/deploy.yml`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`eslint-plugin-unused-imports` is in `dependencies`, not `devDependencies`**

`backend/package.json` line 21:
```json
"dependencies": {
  ...
  "eslint-plugin-unused-imports": "^4.4.1",
  ...
}
```

This is a lint-only package with no runtime use. Because it is listed under `dependencies`, `npm ci --omit=dev` (line 91 of the workflow) will still install it on the production server, pulling in its entire transitive tree unnecessarily. On a constrained VPS this wastes disk space and install time on every deploy.

**Fix:** Move it to `devDependencies`:
```json
"devDependencies": {
  ...
  "eslint-plugin-unused-imports": "^4.4.1",
  ...
}
```

Useful? React with 👍 / 👎.

Fixed. `eslint-plugin-unused-imports` is now in `devDependencies` in `backend/package.json`. `npm ci --omit=dev` on the production server will no longer install it or its transitive tree. Typecheck passed after the move. Commit: `fix(backend): move eslint-plugin-unused-imports to devDependencies`.

**Disposition:** fixed — `backend/package.json`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
GitHub Secrets interpolated directly into `run:` shell strings**

Multiple steps expand `${{ secrets.SAKURA_USER }}` and `${{ secrets.SAKURA_HOST }}` directly inside `run:` shell strings (lines 59, 64, 74, 80, 83, 86, 91, 97). GitHub Actions security hardening guidelines flag this pattern: if the secret value were ever set to something containing shell metacharacters (`;`, `` ` ``, `$(...)`), it would be executed as part of the shell command on the Actions runner.

**Fix:** Assign secrets to step-level environment variables and reference them through the shell's own environment, which ensures they are never interpreted as code:

```yaml
- name: Add server to known_hosts
  env:
    SSH_HOST: ${{ secrets.SAKURA_HOST }}
  run: ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts

- name: Create remote directories
  env:
    SSH_USER: ${{ secrets.SAKURA_USER }}
    SSH_HOST: ${{ secrets.SAKURA_HOST }}
  run: |
    ssh "$SSH_USER@$SSH_HOST" "mkdir -p ..."
```

Apply the same pattern to all `ssh` and `rsync` calls in the workflow.

Useful? React with 👍 / 👎.

Fixed. Every step that calls `ssh` or `rsync` now exposes `SSH_USER` and `SSH_HOST` via a step-level `env:` block and references them as `"$SSH_USER@$SSH_HOST"`. The `SAKURA_KNOWN_HOST` secret (introduced by the TOFU fix) is handled the same way. No secret value is expanded directly into a shell string. Commit: `fix(deploy): pin host key, add test gate, env-isolate secrets, backup DB`.

**Disposition:** fixed — `.github/workflows/deploy.yml`

---

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>
`NODE_ENV` is never set to `production` in the deployment config**

`ecosystem.config.cjs` loads environment from `--env-file=/var/www/tdd-todo-app/backend/.env`. The `.env.example` file does not include a `NODE_ENV` entry. If the operator copies `.env.example` to `.env` without explicitly adding `NODE_ENV=production`, the process will run with `NODE_ENV` undefined. Many libraries (including Hono's error handling) gate production-safe behaviour on `NODE_ENV === 'production'`.

**Fix:** Either set it in `ecosystem.config.cjs` via the `env` block (which takes precedence and is not overridable from the file), or add it to `.env.example`:

```js
// ecosystem.config.cjs
{
  name: 'tdd-todo-app',
  script: './dist/server.mjs',
  cwd: '/var/www/tdd-todo-app/backend',
  node_args: '--env-file=/var/www/tdd-todo-app/backend/.env',
  env: {
    NODE_ENV: 'production',
  },
  ...
}
```

Useful? React with 👍 / 👎.

Fixed. Added `env: { NODE_ENV: 'production' }` to the pm2 app config in `ecosystem.config.cjs`. The pm2 `env` block takes precedence over `--env-file`, so this guarantees production mode regardless of what the operator wrote in `.env`. Commit: `fix(ecosystem): set NODE_ENV=production and document path coupling`.

**Disposition:** fixed — `backend/ecosystem.config.cjs`

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
Hardcoded absolute path in `ecosystem.config.cjs` diverges from the workflow `DEPLOY_PATH` variable**

`ecosystem.config.cjs` hard-codes `/var/www/tdd-todo-app/backend` in both `cwd` and `node_args`. The workflow defines the same path via `env.DEPLOY_PATH: /var/www/tdd-todo-app`. If `DEPLOY_PATH` is ever updated in the workflow, the ecosystem config will silently diverge, causing `pm2 start` to fail with a path-not-found error on the first deploy after the change.

**Fix:** Add a comment coupling the two, and consider generating the file from the workflow or templating the path. At minimum, add a comment in both files referencing the other:

```js
// IMPORTANT: cwd and node_args must match DEPLOY_PATH in .github/workflows/deploy.yml
cwd: '/var/www/tdd-todo-app/backend',
node_args: '--env-file=/var/www/tdd-todo-app/backend/.env',
```

Useful? React with 👍 / 👎.

Fixed. Added inline `// IMPORTANT: must match DEPLOY_PATH in .github/workflows/deploy.yml` comments on both the `cwd` and `node_args` lines, and added a `PATH COUPLING` block to the file-level JSDoc explaining that both places must be updated together. Commit: `fix(ecosystem): set NODE_ENV=production and document path coupling`.

**Disposition:** fixed — `backend/ecosystem.config.cjs`

---

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-blue?style=flat)</sub></sub>
`dist/` added to `.gitignore` but already tracked files are not removed from the index**

The `.gitignore` change adds `dist/` to tell Git to stop tracking the build output directory. However, if any `dist/` files were previously committed and are still in the Git index, `.gitignore` will not untrack them — Git only ignores untracked files. This means stale build artifacts from the old index could remain in the repository and be checked out on the server during `actions/checkout`.

**Verify and fix:**
```bash
git ls-files --cached backend/dist/
# if any files are listed:
git rm -r --cached backend/dist/
git commit -m "chore: remove tracked dist artifacts now covered by .gitignore"
```

Useful? React with 👍 / 👎.

No action needed. Ran `git ls-files --cached backend/dist/` — the output was empty, confirming no `dist/` files are currently tracked in the Git index. The `.gitignore` entry is sufficient and no `git rm --cached` is required.

**Disposition:** reply only — `backend/dist/` is not in the Git index; `.gitignore` is already effective.
