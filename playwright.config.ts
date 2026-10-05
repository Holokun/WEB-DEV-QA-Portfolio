import { defineConfig } from '@playwright/test';
// Playwright sets FORCE_COLOR on workers. Avoid conflicting inherited NO_COLOR warnings.
delete process.env.NO_COLOR;
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  globalSetup: './tests/fixtures/suite.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'api', testMatch: 'api/**/*.spec.ts' },
    ...(['chromium', 'firefox', 'webkit'] as const).map(browserName => ({
      name: browserName, testMatch: 'e2e/**/*.spec.ts', use: { browserName, viewport: { width: 1280, height: 800 } },
    })),
    { name: 'chromium-phone', testMatch: 'e2e/layout.spec.ts', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
});
