import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import type { Page } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { emailVariants, descriptionBoundaries } from '../fixtures/feedback-data.js';

const submit = (page: Page) => page.getByRole('button', { name: 'Submit feedback', exact: true });
const feedbackResponse = (page: Page) => page.waitForResponse(response => new URL(response.url()).pathname === '/api/feedback' && response.request().method() === 'POST');
function rows(dbPath: string) {
  const db = new DatabaseSync(dbPath);
  try { return db.prepare('SELECT id, game_id, email, description FROM feedback ORDER BY id').all(); }
  finally { db.close(); }
}
async function fill(page: Page, email: string, description: string) {
  await page.getByLabel('Game', { exact: true }).selectOption('1');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Description', { exact: true }).fill(description);
}
async function accept(page: Page, dbPath: string, email: string, description: string) {
  const before = rows(dbPath);
  const responsePromise = feedbackResponse(page);
  await submit(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const { id } = await response.json() as { id: number };
  expect(Number.isSafeInteger(id) && id > 0).toBe(true);
  await expect(page.getByRole('status')).toContainText('Feedback submitted');
  const after = rows(dbPath);
  expect(after).toHaveLength(before.length + 1);
  expect(after.filter(row => row.id === id)).toEqual([{ id, game_id: 1, email, description }]);
}
function countPosts(page: Page) {
  let count = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/feedback' && request.method() === 'POST') ++count; });
  return () => count;
}

test('TEST-UI-09: empty submission identifies all required fields without request or insertion', async ({ page, dbPath }) => {
  const count = countPosts(page);
  const before = rows(dbPath);
  await page.goto('/#/feedback');
  await expect(submit(page)).toBeVisible();
  await expect(page.getByLabel('Game', { exact: true })).toBeEnabled();
  await submit(page).click();
  for (const name of ['Game', 'Email', 'Description']) {
    const field = page.getByLabel(name, { exact: true });
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(/\S/);
  }
  expect(count()).toBe(0);
  expect(rows(dbPath)).toEqual(before);
  await expect(page.getByLabel('Game', { exact: true })).toBeFocused();
});

test('TEST-UI-11: primary valid submission returns 201 and stores exactly one matching row @smoke', async ({ page, dbPath }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link')).toHaveText(['Library', 'Favourites (0)', 'Feedback']);
  await nav.getByRole('link', { name: 'Feedback', exact: true }).click();
  await expect(page.getByRole('main')).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Feedback', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByLabel('Game', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Game', { exact: true }).getByRole('option')).toHaveCount(11);
  const description = `Primary UI submission ${randomUUID()}`;
  await fill(page, '  Player@example.com  ', `  ${description}  `);
  await accept(page, dbPath, 'Player@example.com', description);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
});

for (const variant of emailVariants) {
  test(`TEST-UI-10: ${variant.id} ${variant.accepted ? 'accepts' : 'rejects'} its literal email example`, async ({ page, dbPath }) => {
    const count = countPosts(page);
    const before = rows(dbPath);
    await page.goto('/#/feedback');
    const description = `Email variant ${variant.id} ${randomUUID()}`;
    await fill(page, variant.email, description);
    if (variant.accepted) await accept(page, dbPath, variant.stored!, description);
    else {
      await submit(page).click();
      await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByLabel('Email', { exact: true })).toHaveAccessibleDescription(/valid email/i);
      expect(count()).toBe(0);
      expect(rows(dbPath)).toEqual(before);
    }
  });
}

const descriptions = [
  ...descriptionBoundaries,
  { id: 'ASCII-20', description: '12345678901234567890', accepted: true, stored: '12345678901234567890' },
  { id: 'EMOJI-20', description: '🎮'.repeat(20), accepted: true, stored: '🎮'.repeat(20) },
  { id: 'EMPTY-LITERAL', description: '', accepted: false },
];
for (const variant of descriptions) {
  test(`TEST-UI-10: ${variant.id} keeps the fixed Unicode/trim boundary unchanged`, async ({ page, dbPath }) => {
    const count = countPosts(page);
    const before = rows(dbPath);
    await page.goto('/#/feedback');
    await fill(page, 'player@example.com', variant.description);
    if (variant.accepted) await accept(page, dbPath, 'player@example.com', 'stored' in variant ? variant.stored! : variant.description);
    else {
      await submit(page).click();
      await expect(page.getByLabel('Description', { exact: true })).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByLabel('Description', { exact: true })).toHaveAccessibleDescription(/at least 20/i);
      expect(count()).toBe(0);
      expect(rows(dbPath)).toEqual(before);
    }
  });
}

for (const failure of ['controlled network abort', 'controlled HTTP 500']) {
  test(`TEST-UI-11: ${failure} preserves every field and retry stores one row`, async ({ page }) => {
    const dbPath = ownedDatabase();
    const app = await startApp(dbPath);
    try {
      await page.goto(`${app.baseURL}/#/feedback`);
      const description = `  Retry submission ${randomUUID()}  `;
      await fill(page, '  Player@example.com  ', description);
      const before = rows(dbPath);
      await page.route('**/api/feedback', route => failure.includes('500')
        ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } })
        : route.abort('failed'));
      await submit(page).click();
      await expect(page.getByRole('alert')).toContainText('Could not submit feedback');
      await expect(page.getByLabel('Game', { exact: true })).toHaveValue('1');
      await expect(page.getByLabel('Email', { exact: true })).toHaveValue('  Player@example.com  ');
      await expect(page.getByLabel('Description', { exact: true })).toHaveValue(description);
      expect(rows(dbPath)).toEqual(before);
      await expect(submit(page)).toBeEnabled();
      await page.unroute('**/api/feedback');
      await accept(page, dbPath, 'Player@example.com', description.trim());
      await expect(page.getByRole('alert')).toBeHidden();
    } finally { await app.stop(); }
  });
}

test('TEST-UI-11: repeated submit events while pending send one real request and insert one row', async ({ page }) => {
  const dbPath = ownedDatabase();
  const app = await startApp(dbPath);
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  try {
    const count = countPosts(page);
    await page.route('**/api/feedback', async route => { await hold; await route.continue(); });
    await page.goto(`${app.baseURL}/#/feedback`);
    const description = `Single pending submission ${randomUUID()}`;
    await fill(page, 'player@example.com', description);
    const before = rows(dbPath);
    const responsePromise = feedbackResponse(page);
    await submit(page).click();
    await expect(page.getByRole('status')).toContainText('Submitting');
    await expect(submit(page)).toBeDisabled();
    await submit(page).evaluate(button => {
      const form = (button as HTMLButtonElement).form!;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    release();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const { id } = await response.json() as { id: number };
    await expect(page.getByRole('status')).toContainText('Feedback submitted');
    expect(count()).toBe(1);
    const after = rows(dbPath);
    expect(after).toHaveLength(before.length + 1);
    expect(after.filter(row => row.id === id)).toEqual([{ id, game_id: 1, email: 'player@example.com', description }]);
  } finally { release(); await app.stop(); }
});

for (const result of ['success', 'controlled HTTP 500']) {
  test(`TEST-UI-11: navigation ignores a late submission ${result}`, async ({ page }) => {
    const dbPath = ownedDatabase();
    const app = await startApp(dbPath);
    let release!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    try {
      // Deliberately keep transport alive to exercise stale-result ownership after destroy.
      await page.addInitScript(() => {
        const original = window.fetch.bind(window);
        window.fetch = (input, init) => original(input, { ...init, signal: undefined });
      });
      const description = `Late response ${randomUUID()}`;
      let acceptedId: number | undefined;
      await page.route('**/api/feedback', async route => {
        const response = result === 'success' ? await route.fetch() : undefined;
        if (response) {
          expect(response.status()).toBe(201);
          acceptedId = (await response.json() as { id: number }).id;
        }
        await hold;
        if (response) await route.fulfill({ response });
        else await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } });
      });
      await page.goto(`${app.baseURL}/#/feedback`);
      const before = rows(dbPath);
      await fill(page, 'player@example.com', description);
      await submit(page).click();
      await expect(page.getByRole('status')).toContainText('Submitting');
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Library', exact: true }).click();
      await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
      const responsePromise = feedbackResponse(page);
      release();
      await responsePromise;
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
      await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
      await expect(page.getByText(/Feedback submitted|Could not submit feedback/)).toHaveCount(0);
      const after = rows(dbPath);
      if (result === 'success') {
        expect(after).toHaveLength(before.length + 1);
        expect(after.filter(row => row.id === acceptedId)).toEqual([{ id: acceptedId, game_id: 1, email: 'player@example.com', description }]);
      } else expect(after).toEqual(before);
    } finally { release(); await app.stop(); }
  });
}

for (const width of [1280, 375]) {
  test(`TEST-UI-09/12/13: feedback fields work by keyboard with visible focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 800 });
    await page.goto('/#/feedback');
    await expect(page.getByLabel('Game', { exact: true }).getByRole('option')).toHaveCount(11);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Game', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Game', { exact: true })).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Description', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(submit(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Game', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`feedback-${width}.png`), fullPage: true });
  });
}

for (const failure of ['controlled network abort', 'controlled HTTP 500']) {
  test(`TEST-UI-10/11: game-list ${failure} retains saved IDs until complete recovery`, async ({ page }) => {
    const dbPath = ownedDatabase();
    const app = await startApp(dbPath);
    try {
      await page.addInitScript(() => localStorage.setItem('game-companion:favourites', '[1,999]'));
      await page.route('**/api/games', route => failure.includes('500')
        ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } })
        : route.abort('failed'));
      await page.goto(`${app.baseURL}/#/feedback`);
      await expect(page.getByRole('alert')).toContainText('Could not load games');
      await expect(page.getByRole('link', { name: /^Favourites/ })).toHaveText('Favourites (2)');
      await page.getByLabel('Email', { exact: true }).fill('player@example.com');
      const description = `Recovery after catalogue failure ${randomUUID()}`;
      await page.getByLabel('Description', { exact: true }).fill(description);
      await page.unroute('**/api/games');
      await page.getByRole('button', { name: 'Retry loading games', exact: true }).click();
      await expect(page.getByLabel('Game', { exact: true }).getByRole('option')).toHaveCount(11);
      await expect(page.getByRole('link', { name: /^Favourites/ })).toHaveText('Favourites (1)');
      await expect(page.getByLabel('Email', { exact: true })).toHaveValue('player@example.com');
      await expect(page.getByLabel('Description', { exact: true })).toHaveValue(description);
      await page.getByLabel('Game', { exact: true }).selectOption('1');
      await accept(page, dbPath, 'player@example.com', description);
    } finally { await app.stop(); }
  });
}
