import { test, expect } from '@playwright/test';
import { checkAccessibility } from '../../../../tests/accessibility/check.js';
test('RED controlled missing-label serious sentinel - test instrumentation only', async ({ page }, info) => {
  await page.setContent('<!doctype html><html lang="en"><head><title>Axe gate sentinel</title></head><body><main><h1>Controlled test instrumentation</h1><div role="textbox" tabindex="0" contenteditable="true"></div></main></body></html>');
  await expect(page.getByRole('heading', { name: 'Controlled test instrumentation' })).toBeVisible();
  await checkAccessibility(page, info, 'sentinel-missing-label');
});


