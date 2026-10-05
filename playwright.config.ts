import { defineConfig } from '@playwright/test';
// Playwright sets FORCE_COLOR on workers. Avoid conflicting inherited NO_COLOR warnings.
delete process.env.NO_COLOR;
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  projects: [{ name: 'api', testMatch: 'api/**/*.spec.ts' }],
});
