import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import type { Page } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';

const key = 'game-companion:favourites';
const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Favourites/ });
const saved = (page: Page) => page.getByRole('list', { name: 'Favourite games' });
const stored = (page: Page) => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) ?? '[]') as unknown, key);
async function seed(page: Page, value: string) {
  await page.addInitScript(({ storageKey, value }) => localStorage.setItem(storageKey, value), { storageKey: key, value });
}

test('TEST-UI-07/08: cards, detail and saved list share immediate state and reload persistence', async ({ page }) => {
  let catalogueRequests = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/games') ++catalogueRequests; });
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
  expect(catalogueRequests).toBe(1);
  await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(nav(page)).toHaveText('Favourites (1)');
  await page.getByRole('link', { name: 'Orbit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Orbit to favourites', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(nav(page)).toHaveText('Favourites (0)');
  await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
  await nav(page).click();
  await expect(page).toHaveURL(/#\/favourites$/);
  await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
  await expect(page.getByRole('main')).toBeFocused();
  await page.reload();
  await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
  await expect(nav(page)).toHaveText('Favourites (1)');
  await saved(page).getByRole('link', { name: 'Orbit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await nav(page).click();
  await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
  await page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true }).click();
  await expect(saved(page).getByRole('listitem')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('No favourites yet');
  await expect(nav(page)).toHaveText('Favourites (0)');
  await page.reload();
  await expect(page.getByRole('status')).toContainText('No favourites yet');
  expect(await stored(page)).toEqual([]);
});

for (const value of ['{broken', '{"id":1}', 'null']) {
  test(`TEST-UI-08: malformed/non-array storage ${value} recovers to usable empty state`, async ({ page }) => {
    await seed(page, value);
    await page.goto('/#/favourites');
    await expect(page.getByRole('status')).toContainText('No favourites yet');
    await expect(nav(page)).toHaveText('Favourites (0)');
    expect(await stored(page)).toEqual([]);
    await page.getByRole('link', { name: 'Library', exact: true }).click();
    await page.getByRole('button', { name: 'Add Atlas Tactics to favourites', exact: true }).click();
    await expect(nav(page)).toHaveText('Favourites (1)');
  });
}

test('TEST-UI-08: invalid/duplicate IDs normalize; failed/filtered requests retain candidates until complete success', async ({ page }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const db = new DatabaseSync(dbPath);
  try { db.exec('DELETE FROM patch_notes WHERE game_id=1; DELETE FROM games WHERE id=1'); }
  finally { db.close(); }
  const app = await startApp(dbPath);
  try {
    await seed(page, '[1,10,1,999,0,-1,1.5,"2",null,true,{},[],9007199254740992]');
    await page.route('**/api/games', route => route.abort('failed'));
    await page.goto(app.baseURL);
    await expect(page.getByRole('alert')).toContainText('Could not load games');
    await expect(nav(page)).toHaveText('Favourites (3)');
    expect(await stored(page)).toEqual([1,10,999]);
    await page.getByRole('textbox', { name: 'Search games' }).fill('Atlas');
    await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveText(['Atlas Tactics']);
    await expect(nav(page)).toHaveText('Favourites (3)');
    expect(await stored(page)).toEqual([1,10,999]);
    await page.route('**/api/games?**', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } }));
    await page.getByLabel('Genre').selectOption('Strategy');
    await expect(page.getByRole('alert')).toContainText('Could not load games');
    expect(await stored(page)).toEqual([1,10,999]);
    await expect(nav(page)).toHaveText('Favourites (3)');
    await page.unroute('**/api/games');
    await page.getByRole('button', { name: 'Clear controls' }).click();
    await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(9);
    await expect(nav(page)).toHaveText('Favourites (1)');
    expect(await stored(page)).toEqual([10]);
  } finally { await app.stop(); }
});

test('TEST-UI-08: games hidden by search and genre remain saved', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
  await page.getByRole('button', { name: 'Add Atlas Tactics to favourites', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search games' }).fill('Ember');
  await page.getByLabel('Genre').selectOption('RPG');
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveText(['Ember Quest']);
  await expect(nav(page)).toHaveText('Favourites (2)');
  expect(await stored(page)).toEqual([1,10]);
  await nav(page).click();
  await expect(saved(page).getByRole('link')).toHaveText(['Atlas Tactics', 'Orbit']);
});

for (const failure of ['HTTP 500', 'network abort']) {
  test(`TEST-UI-08: direct saved route loading and ${failure} retain candidates; Retry validates complete catalogue`, async ({ page }) => {
    await seed(page, '[1,999]');
    let release!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/games', async route => {
      await hold;
      if (failure === 'HTTP 500') await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } });
      else await route.abort('failed');
    });
    await page.goto('/#/favourites');
    await expect(page.getByRole('heading', { name: 'Favourites', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Loading favourites');
    await expect(nav(page)).toHaveText('Favourites (2)');
    release();
    await expect(page.getByRole('alert')).toContainText('Could not load favourites');
    await expect(page.getByRole('status')).not.toContainText('No favourites yet');
    expect(await stored(page)).toEqual([1,999]);
    await expect(nav(page)).toHaveText('Favourites (2)');
    await page.unroute('**/api/games');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
    await expect(nav(page)).toHaveText('Favourites (1)');
    expect(await stored(page)).toEqual([1]);
    await expect(page.getByRole('alert')).toBeHidden();
  });
}

for (const failure of ['access', 'read', 'write'] as const) {
  test(`TEST-UI-08: localStorage ${failure} failure warns and keeps toggles and navigation usable`, async ({ page }) => {
    await page.addInitScript(failure => {
      if (failure === 'access') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
      else Storage.prototype[failure === 'read' ? 'getItem' : 'setItem'] = () => { throw new DOMException('Denied', 'SecurityError'); };
    }, failure);
    await page.goto('/');
    if (failure !== 'write') await expect(page.getByText(/Favourites.*browser storage/i)).toBeVisible();
    await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
    await expect(page.getByText(/Favourites.*browser storage/i)).toBeVisible();
    await expect(nav(page)).toHaveText('Favourites (1)');
    await nav(page).click();
    await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
    await page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true }).click();
    await expect(nav(page)).toHaveText('Favourites (0)');
    await expect(page.getByRole('status')).toContainText('No favourites yet');
  });
}

for (const failure of ['write', 'access'] as const) {
  test(`TEST-UI-08: Library return retains memory favourites after storage ${failure} failure`, async ({ page }) => {
    await page.addInitScript(failure => {
      if (failure === 'access') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
      else Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
    }, failure);
    await page.goto('/');
    await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
    await nav(page).click();
    await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
    const library = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Library', exact: true });
    await expect(library).toHaveAttribute('href', '/');
    // Observe the app's cancellation before suppressing native navigation in this probe.
    const cancelled = await library.evaluate(link =>
      [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }].map(options => {
        let intercepted = false;
        link.addEventListener('click', event => {
          intercepted = event.defaultPrevented;
          event.preventDefault();
        }, { once: true });
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...options }));
        return intercepted;
      }));
    expect(cancelled).toEqual([false, false, false, false, false]);
    await library.click();
    await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
    await expect(nav(page)).toHaveText('Favourites (1)');
    await expect(page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('main')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.getByText(/Favourites.*browser storage/i)).toBeVisible();
    await nav(page).click();
    await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
    // Explicit reload still starts a new visit from the last persisted value.
    await page.reload();
    await expect(nav(page)).toHaveText('Favourites (0)');
    await expect(page.getByRole('status')).toContainText('No favourites yet');
  });
}

test('TEST-UI-08: a destroyed saved view cannot validate IDs after late complete success', async ({ page }) => {
  await seed(page, '[1,999]');
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => original(input, { ...init, signal: undefined });
  });
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/games', async route => {
    const response = await route.fetch();
    await hold;
    await route.fulfill({ response });
  });
  await page.goto('/#/favourites');
  await expect(page.getByRole('status')).toContainText('Loading favourites');
  await page.evaluate(() => { location.hash = '/games/1'; });
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  const response = page.waitForResponse(url => new URL(url.url()).pathname === '/api/games');
  release();
  await response;
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  await expect(nav(page)).toHaveText('Favourites (2)');
  expect(await stored(page)).toEqual([1,999]);
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
});

test('TEST-UI-08: failed storage writes keep the last persisted selection on reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(storageKey => localStorage.setItem(storageKey, '[10]'), key);
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.reload();
  await page.getByRole('button', { name: 'Remove Atlas Tactics from favourites', exact: true }).click();
  await expect(nav(page)).toHaveText('Favourites (0)');
  await expect(page.getByText(/Favourites.*browser storage/i)).toBeVisible();
  expect(await stored(page)).toEqual([10]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove Atlas Tactics from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(nav(page)).toHaveText('Favourites (1)');
});

test('TEST-UI-07/12: removing saved cards retains focus on neighbouring controls and then the empty heading', async ({ page }) => {
  await seed(page, '[1,2,10]');
  await page.goto('/#/favourites');
  await expect(saved(page).getByRole('link')).toHaveText(['Atlas Tactics', 'Orbit', 'ORBIT']);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Remove Atlas Tactics from favourites', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true })).toBeFocused();
  await expect(nav(page)).toHaveText('Favourites (2)');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Remove ORBIT from favourites', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Favourites', exact: true })).toBeFocused();
  await expect(nav(page)).toHaveText('Favourites (0)');
});

for (const width of [1280,375]) {
  test(`TEST-UI-07/12/13: favourite controls use keyboard with visible focus and fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 800 });
    await page.goto('/#/games/1');
    const add = page.getByRole('button', { name: 'Add Orbit to favourites', exact: true });
    await expect(add).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Patch notes', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(add).toBeFocused();
    await expect(add).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await nav(page).click();
    await expect(saved(page).getByRole('link')).toHaveText(['Orbit']);
    await page.keyboard.press('Tab');
    await expect(saved(page).getByRole('link')).toBeFocused();
    await page.keyboard.press('Tab');
    const remove = page.getByRole('button', { name: 'Remove Orbit from favourites', exact: true });
    await expect(remove).toBeFocused();
    await expect(remove).toHaveCSS('outline-style', 'solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`favourites-${width}.png`), fullPage: true });
    await page.keyboard.press('Enter');
    await expect(saved(page).getByRole('listitem')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Favourites', exact: true })).toBeFocused();
  });
}
