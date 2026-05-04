'use strict';

/**
 * PM2 ecosystem configuration for production deployment.
 *
 * Server prerequisites (one-time manual setup):
 *   - Node.js 20+, npm, pm2  (npm install -g pm2)
 *   - MySQL running and accessible
 *   - /var/www/tdd-todo-app/backend/.env  (copy from .env.example and fill in values)
 *   - pm2 startup hook: pm2 startup && pm2 save
 *
 * PATH COUPLING: The `cwd` and `node_args` paths below must match the
 * `DEPLOY_PATH` environment variable defined in .github/workflows/deploy.yml.
 * Update both places together if the deployment path ever changes.
 */

/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: 'tdd-todo-app',
      script: './dist/server.mjs',
      // IMPORTANT: must match DEPLOY_PATH in .github/workflows/deploy.yml
      cwd: '/var/www/tdd-todo-app/backend',
      // Load .env via Node.js 20+ built-in flag
      // IMPORTANT: must match DEPLOY_PATH in .github/workflows/deploy.yml
      node_args: '--env-file=/var/www/tdd-todo-app/backend/.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
