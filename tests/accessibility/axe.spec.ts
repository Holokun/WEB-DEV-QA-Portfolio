import { test, expect } from '../fixtures/app.js';
import type { Page } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { checkAccessibility } from './check.js';

const cards = (page: Page) => page.getByRole('list', { name: 'Games', exact: true }).getByRole('link');
const scan = checkAccessibility;
function feedbackRows(path: string) {
  const db = new DatabaseSync(path);
  try { return db.prepare('SELECT id, game_id, email, description FROM feedback ORDER BY id').all(); }
  finally { db.close(); }
}
async function feedbackReady(page: Page) {
  await expect(page.getByRole('heading', { name: 'Feedback', exact: true })).toBeVisible();
  await expect(page.getByLabel('Game', { exact: true })).toBeEnabled();
  await expect(page.getByLabel('Game', { exact: true }).getByRole('option')).toHaveCount(11);
}
async function fillFeedback(page: Page) {
  await page.getByLabel('Game', { exact: true }).selectOption('1');
  await page.getByLabel('Email', { exact: true }).fill('  accessibility@example.com  ');
  await page.getByLabel('Description', { exact: true }).fill('  Synthetic accessibility feedback for the local test.  ');
}

for (const sentinel of [
  { impact: 'critical', html: '<input type="text">', rule: 'label' },
  { impact: 'serious', html: '<div role="textbox" tabindex="0" contenteditable="true"></div>', rule: 'aria-input-field-name' },
]) {
  test(`Accessibility gate sentinel: controlled missing-label ${sentinel.impact} violation is rejected (instrumentation)`, async ({ page }, info) => {
    await page.setContent(`<!doctype html><html lang="en"><head><title>Axe gate sentinel</title></head><body><main><h1>Controlled test instrumentation</h1>${sentinel.html}</main></body></html>`);
    await expect(page.getByRole('heading', { name: 'Controlled test instrumentation' })).toBeVisible();
    await expect(scan(page, info, `sentinel-${sentinel.impact}-missing-label`)).rejects.toThrow(new RegExp(sentinel.rule));
  });
}

test('TEST-A11Y-01 catalogue: loaded, filtered, invalid and empty states', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find your next world.' })).toBeVisible();
  await expect(cards(page)).toHaveCount(10);
  await scan(page, info, 'catalogue-loaded');
  await page.getByRole('textbox', { name: 'Search games' }).fill('Ember');
  await page.getByLabel('Genre', { exact: true }).selectOption('RPG');
  await expect(cards(page)).toHaveText(['Ember Quest']);
  await scan(page, info, 'catalogue-filtered');
  let requests = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/games') ++requests; });
  await page.getByRole('textbox', { name: 'Search games' }).fill('a'.repeat(81));
  await expect(page.getByRole('textbox', { name: 'Search games' })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeVisible();
  await scan(page, info, 'catalogue-invalid-search');
  expect(requests).toBe(0);
  await page.getByRole('textbox', { name: 'Search games' }).fill('no-such-title');
  await expect(page.getByRole('status')).toContainText('No games found');
  await expect(cards(page)).toHaveCount(0);
  await scan(page, info, 'catalogue-empty');
});

test('TEST-A11Y-01 catalogue: real response loading, HTTP error and Retry recovery', async ({ page }, info) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/games', async route => { await held; await route.continue(); });
  try {
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Search games' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Loading games');
    await scan(page, info, 'catalogue-loading');
  } finally { release(); }
  await expect(cards(page)).toHaveCount(10);
  await page.unroute('**/api/games');
  await page.route('**/api/games?*', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Controlled a11y failure state.' } } }));
  await page.getByRole('textbox', { name: 'Search games' }).fill('Orbit');
  await expect(page.getByRole('alert')).toContainText('Could not load games');
  await expect(cards(page)).toHaveCount(10);
  await scan(page, info, 'catalogue-error-retained');
  await page.unroute('**/api/games?*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(cards(page)).toHaveText(['Orbit', 'ORBIT']);
  await expect(page.getByRole('alert')).toBeHidden();
  await scan(page, info, 'catalogue-recovered');
});

test('TEST-A11Y-02 detail: real game, expanded patch notes, notes error and recovery', async ({ page }, info) => {
  await page.goto('/#/games/1');
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await expect(page.getByText('Defend a tiny space station from drifting robots.', { exact: true })).toBeVisible();
  await scan(page, info, 'detail-loaded');
  await page.route('**/api/games/1/patch-notes', route => route.abort('failed'));
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  const notes = page.getByRole('region', { name: 'Patch notes', exact: true });
  await expect(notes.getByRole('alert')).toContainText('Could not load patch notes');
  await scan(page, info, 'detail-notes-error');
  await page.unroute('**/api/games/1/patch-notes');
  await notes.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(notes.getByRole('listitem')).toHaveCount(3);
  await expect(notes.getByRole('status')).toContainText('3 patch notes loaded');
  await scan(page, info, 'detail-notes-expanded');
});

test('TEST-A11Y-02 detail: HTTP error and real Retry recovery', async ({ page }, info) => {
  await page.route('**/api/games/1', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Controlled a11y failure state.' } } }));
  await page.goto('/#/games/1');
  await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Could not load game details');
  await scan(page, info, 'detail-error');
  await page.unroute('**/api/games/1');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await scan(page, info, 'detail-recovered');
});

test('TEST-A11Y-02 feedback: normal, invalid, request error, pending and real success', async ({ page, dbPath }, info) => {
  await page.goto('/#/feedback');
  await feedbackReady(page);
  await scan(page, info, 'feedback-ready');
  const before = feedbackRows(dbPath);
  let posts = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/feedback' && request.method() === 'POST') ++posts; });
  await page.getByRole('button', { name: 'Submit feedback', exact: true }).click();
  for (const name of ['Game', 'Email', 'Description']) {
    await expect(page.getByLabel(name, { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel(name, { exact: true })).toHaveAccessibleDescription(/\S/);
  }
  await scan(page, info, 'feedback-invalid');
  expect(posts).toBe(0);
  expect(feedbackRows(dbPath)).toEqual(before);
  await fillFeedback(page);
  await page.route('**/api/feedback', route => route.abort('failed'));
  await page.getByRole('button', { name: 'Submit feedback', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not submit feedback');
  expect(feedbackRows(dbPath)).toEqual(before);
  await scan(page, info, 'feedback-request-error');
  await page.unroute('**/api/feedback');
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/feedback', async route => { await held; await route.continue(); });
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/feedback' && response.request().method() === 'POST');
  try {
    await page.getByRole('button', { name: 'Submit feedback', exact: true }).click();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('status')).toContainText('Submitting feedback');
    await scan(page, info, 'feedback-pending');
  } finally { release(); }
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const { id } = await response.json() as { id: number };
  expect(Number.isSafeInteger(id) && id > 0).toBe(true);
  await expect(page.getByRole('status')).toContainText('Feedback submitted');
  const after = feedbackRows(dbPath);
  expect(after).toHaveLength(before.length + 1);
  expect(after.filter(row => row.id === id)).toEqual([{ id, game_id: 1, email: 'accessibility@example.com', description: 'Synthetic accessibility feedback for the local test.' }]);
  await scan(page, info, 'feedback-success');
});

test('TEST-A11Y-01 favourites supplement: saved and empty views', async ({ page }, info) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(10);
  await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
  await page.getByRole('link', { name: 'Favourites (1)', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Favourite games' }).getByRole('link')).toHaveText(['Orbit']);
  await scan(page, info, 'favourites-saved');
  await page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No favourites yet');
  await scan(page, info, 'favourites-empty');
});

