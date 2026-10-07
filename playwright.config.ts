import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Ambiente compartilhado com outros candidatos: poucos workers para não sobrecarregar.
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://verzel-store.qa-test-verzel-store.workers.dev',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testDir: './tests/api' },
    { name: 'e2e-chromium', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } },
  ],
});
