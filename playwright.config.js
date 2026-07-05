import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 10_000,
  webServer: {
    command: 'node src/server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
