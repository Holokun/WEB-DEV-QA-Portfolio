import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import type { Page } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function visibleFocus(page: Page, name: string, role: 'link' | 'button') {
  const control = page.getByRole(role, { name, exact: true });
  await expect(control).toBeFocused();
  await expect(control).toHaveCSS('outline-style', 'solid');
  expect(Number.parseFloat(await control.evaluate(element => getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
}

test('TEST-UI-13 first-slice viewport: catalogue controls, filtered cards, detail and notes fit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
  await noOverflow(page);
  await page.screenshot({ path: test.info().outputPath('catalogue-view.png'), fullPage: true });
  await page.getByRole('textbox', { name: 'Search games' }).fill('Orbit');
  await page.getByLabel('Genre').selectOption('Action');
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveText(['Orbit']);
  await noOverflow(page);
  await page.getByRole('link', { name: 'Orbit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await noOverflow(page);
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Patch notes' }).getByRole('listitem')).toHaveCount(3);
  await noOverflow(page);
  await page.screenshot({ path: test.info().outputPath('detail-view.png'), fullPage: true });
});

test('TEST-UI-13 first-slice viewport: loading and errors remain usable without overflow', async ({ page }) => {
  let releaseCatalogue!: () => void;
  const catalogueHeld = new Promise<void>(resolve => { releaseCatalogue = resolve; });
  await page.route('**/api/games', async route => { await catalogueHeld; await route.abort('failed'); });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Loading games');
  await noOverflow(page);
  releaseCatalogue();
  await expect(page.getByRole('alert')).toContainText('Could not load games');
  await noOverflow(page);
  let releaseDetail!: () => void;
  const detailHeld = new Promise<void>(resolve => { releaseDetail = resolve; });
  await page.route('**/api/games/1', async route => { await detailHeld; await route.abort('failed'); });
  await page.goto('/#/games/1');
  await expect(page.getByRole('status')).toContainText('Loading game details');
  await noOverflow(page);
  releaseDetail();
  await expect(page.getByRole('alert')).toContainText('Could not load game details');
  await noOverflow(page);
  await page.unroute('**/api/games/1');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  let releaseNotes!: () => void;
  const notesHeld = new Promise<void>(resolve => { releaseNotes = resolve; });
  await page.route('**/api/games/1/patch-notes', async route => { await notesHeld; await route.abort('failed'); });
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  const region = page.getByRole('region', { name: 'Patch notes' });
  await expect(region.getByRole('status')).toContainText('Loading patch notes');
  await noOverflow(page);
  releaseNotes();
  await expect(region.getByRole('alert')).toContainText('Could not load patch notes');
  await noOverflow(page);
  await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();
});

test('TEST-UI-13 first-slice viewport: isolated long title, description, platforms and notes wrap', async ({ page }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const title = `Long${'Title'.repeat(75)}`;
  const description = 'Description'.repeat(90);
  const platform = 'Platform'.repeat(50);
  const summary = 'Summary'.repeat(100);
  const db = new DatabaseSync(dbPath);
  try {
    db.prepare('UPDATE games SET title=?,description=?,platforms=? WHERE id=1').run(title, description, JSON.stringify([platform]));
    db.prepare('UPDATE patch_notes SET version=?, summary=? WHERE id=2').run('Version'.repeat(50), summary);
  } finally { db.close(); }
  const app = await startApp(dbPath);
  try {
    await page.goto(app.baseURL);
    await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
    await noOverflow(page);
    await page.getByRole('link', { name: title, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByText(platform, { exact: true })).toBeVisible();
    await noOverflow(page);
    await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
    await expect(page.getByText(summary, { exact: true })).toBeVisible();
    await noOverflow(page);
  } finally { await app.stop(); }
});

test('TEST-UI-12 first-slice: keyboard opens game, follows notes and returns with visible focus', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Search games' })).toBeFocused();
  await page.keyboard.type('Orbit');
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveText(['Orbit', 'ORBIT']);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Genre')).toBeFocused();
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Clear controls', 'button');
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Orbit', 'link');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Back', 'link');
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Patch notes', 'link');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Patch notes' }).getByRole('listitem')).toHaveCount(3);
  await page.keyboard.press('Shift+Tab');
  await visibleFocus(page, 'Add Orbit to favourites', 'button');
  await page.keyboard.press('Shift+Tab');
  await visibleFocus(page, 'Patch notes', 'link');
  await page.keyboard.press('Shift+Tab');
  await visibleFocus(page, 'Back', 'link');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Search games' })).toBeVisible();
});

test('TEST-UI-12 first-slice: detail and notes Retry are reached and activated by keyboard', async ({ page }) => {
  await page.route('**/api/games/1', route => route.abort('failed'));
  await page.goto('/#/games/1');
  await expect(page.getByRole('alert')).toContainText('Could not load game details');
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Back', 'link');
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Retry', 'button');
  await page.unroute('**/api/games/1');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await page.route('**/api/games/1/patch-notes', route => route.abort('failed'));
  // Start at the routed view again to make its sequential order unambiguous.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Back', 'link');
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Patch notes', 'link');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Patch notes' }).getByRole('alert')).toContainText('Could not load patch notes');
  await page.keyboard.press('Tab');
  await visibleFocus(page, 'Retry', 'button');
  await page.unroute('**/api/games/1/patch-notes');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Patch notes' }).getByRole('listitem')).toHaveCount(3);
});
