/**
 * PM2 Ecosystem Configuration
 * Baby Spa - Production Process Management
 *
 * Usage:
 * - pm2 start ecosystem.config.js
 * - pm2 restart all
 * - pm2 logs babyspa-cron
 */

module.exports = {
  apps: [
    {
      name: "babyspa-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "babyspa-cron",
      script: "cron/worker.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      cron_restart: "0 */6 * * *", // Restart every 6 hours for memory cleanup
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
