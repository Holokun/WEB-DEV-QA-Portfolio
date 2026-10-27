import { defineConfig, firefox } from '@playwright/test';
import { basename, dirname, join } from 'node:path';
// Playwright sets FORCE_COLOR on workers. Avoid conflicting inherited NO_COLOR warnings.
delete process.env.NO_COLOR;
// The Windows user cache fails SxS activation on the verified host. Use the same
// official Firefox revision installed by browsers:install in the project cache.
// Explicit Playwright cache overrides and non-Windows environments keep their defaults.
const windowsFirefoxExecutable = process.platform === 'win32' && !process.env.PLAYWRIGHT_BROWSERS_PATH
  ? join(import.meta.dirname, '.playwright-browsers', basename(dirname(dirname(firefox.executablePath()))), 'firefox', 'firefox.exe')
  : undefined;
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/artifacts',
  fullyParallel: false,
  workers: 1,
  globalSetup: './tests/fixtures/suite.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'api', testMatch: 'api/**/*.spec.ts' },
    ...(['chromium', 'firefox', 'webkit'] as const).map(browserName => ({
      name: browserName, testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts'], use: {
        browserName, viewport: { width: 1280, height: 800 },
        launchOptions: browserName === 'firefox' && windowsFirefoxExecutable
          ? { executablePath: windowsFirefoxExecutable } : undefined,
      },
    })),
    { name: 'chromium-phone', testMatch: 'e2e/layout.spec.ts', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
});
