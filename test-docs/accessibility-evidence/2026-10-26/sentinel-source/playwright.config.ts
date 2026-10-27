import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'sentinel.spec.ts', workers: 1,
  outputDir: '../sentinel-artifacts',
  reporter: [['list'], ['json', { outputFile: '../sentinel-red.json' }]],
  use: { browserName: 'chromium', headless: true }
});
