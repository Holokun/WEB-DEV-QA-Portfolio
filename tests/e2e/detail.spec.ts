import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import type { Page, Route } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';

const notes = (page: Page) => page.getByRole('region', { name: 'Patch notes' });
async function orbit(page: Page) {
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
  await expect(page.getByText('Action', { exact: true })).toBeVisible();
  await expect(page.getByText('Defend a tiny space station from drifting robots.', { exact: true })).toBeVisible();
  await expect(page.getByText('2018', { exact: true })).toBeVisible();
  await expect(page.getByText('Windows, Linux', { exact: true })).toBeVisible();
}
async function orderedNotes(page: Page) {
  const items = notes(page).getByRole('listitem');
  await expect(items).toHaveCount(3);
  expect(await items.evaluateAll(elements => elements.map(element => element.getAttribute('data-note-id')))).toEqual(['2', '1', '3']);
  await expect(items).toHaveText([
    '1.1.12026-09-01Fixed training arena navigation.',
    '1.1.02026-09-01Added a training arena.',
    '1.0.02026-08-01Initial release.',
  ]);
}
const failRequest = (failure: string) => async (route: Route) => failure === 'HTTP 500'
  ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } })
  : route.abort('failed');

// Real server responses are held at the browser boundary; cancellation is made
// ineffective so that response ownership, rather than fetch abort, is exercised.
async function holdGameOne(page: Page, resource: 'detail' | 'notes') {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => original(input, { ...init, signal: undefined });
  });
  const url = resource === 'detail' ? '**/api/games/1' : '**/api/games/1/patch-notes';
  let ready!: () => void;
  const pending = new Promise<void>(resolve => { ready = resolve; });
  let release!: (failure: boolean) => void;
  const held = new Promise<boolean>(resolve => { release = resolve; });
  await page.route(url, async route => {
    const response = await route.fetch();
    ready();
    if (await held) await failRequest('HTTP 500')(route);
    else await route.fulfill({ response });
  });
  return {
    pending,
    async release(failure: boolean) {
      const response = page.waitForResponse(response => new URL(response.url()).pathname === (resource === 'detail' ? '/api/games/1' : '/api/games/1/patch-notes'));
      release(failure);
      await response;
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    },
  };
}

test('TEST-UI-06 detail: card opens matching Orbit content, ordered notes and Back @smoke', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Orbit', exact: true }).click();
  await orbit(page);
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  await orderedNotes(page);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search games' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
  await expect(page.getByRole('heading')).toHaveCount(1);
});

test('TEST-UI-06 direct detail entry and browser history restore exactly one view', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Orbit', exact: true }).click();
  await orbit(page);
  await page.goBack();
  await expect(page.getByRole('textbox', { name: 'Search games' })).toBeVisible();
  await page.goForward();
  await orbit(page);
  await page.reload();
  await orbit(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('TEST-UI-06 notes: known game without notes shows explicit empty state', async ({ page }) => {
  await page.goto('/#/games/9');
  await expect(page.getByRole('heading', { name: 'Moss Garden' })).toBeVisible();
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  await expect(notes(page).getByRole('status')).toHaveText('No patch notes available');
  await expect(notes(page).getByRole('listitem')).toHaveCount(0);
  await expect(notes(page).getByRole('alert')).toBeHidden();
});

test('REQ-DET-03 held detail shows loading with usable Back before success', async ({ page }) => {
  const held = await holdGameOne(page, 'detail');
  await page.goto('/#/games/1');
  await held.pending;
  await expect(page.getByRole('status')).toHaveText('Loading game details…');
  await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();
  await held.release(false);
  await orbit(page);
  await expect(page.getByRole('status')).not.toContainText('Loading');
});

test('REQ-DET-04 notes load separately and retain usable details while pending', async ({ page }) => {
  let noteRequests = 0;
  page.on('request', request => { if (request.url().endsWith('/patch-notes')) ++noteRequests; });
  const held = await holdGameOne(page, 'notes');
  await page.goto('/#/games/1');
  await orbit(page);
  expect(noteRequests).toBe(0);
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  await held.pending;
  await expect(notes(page).getByRole('status')).toHaveText('Loading patch notes…');
  await orbit(page);
  await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();
  await held.release(false);
  await orderedNotes(page);
});

for (const failure of ['HTTP 500', 'network abort']) {
  test(`REQ-DET-03 detail ${failure}: current-game Retry recovers content`, async ({ page }) => {
    const fail = failRequest(failure);
    await page.route('**/api/games/1', fail);
    await page.goto('/#/games/1');
    await expect(page.getByRole('alert')).toHaveText('Could not load game detailsRetry');
    await expect(page.getByText('Game not found', { exact: true })).toBeHidden();
    await page.unroute('**/api/games/1', fail);
    const request = page.waitForRequest(request => request.url().endsWith('/api/games/1'));
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await request;
    await orbit(page);
    await expect(page.getByRole('alert')).toBeHidden();
  });

  for (const id of [1, 9]) {
    test(`REQ-DET-04 notes ${failure}: Retry game ${id} to ${id === 1 ? 'ordered notes' : 'empty notes'}`, async ({ page }) => {
      const fail = failRequest(failure);
      await page.route(`**/api/games/${id}/patch-notes`, fail);
      await page.goto(`/#/games/${id}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(id === 1 ? 'Orbit' : 'Moss Garden');
      await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
      await expect(notes(page).getByRole('alert')).toHaveText('Could not load patch notesRetry');
      await expect(notes(page).getByRole('status')).not.toContainText('No patch notes');
      if (id === 1) await orbit(page);
      await page.unroute(`**/api/games/${id}/patch-notes`, fail);
      const request = page.waitForRequest(request => request.url().endsWith(`/api/games/${id}/patch-notes`));
      await notes(page).getByRole('button', { name: 'Retry', exact: true }).click();
      await request;
      if (id === 1) await orderedNotes(page);
      else await expect(notes(page).getByRole('status')).toHaveText('No patch notes available');
      await expect(notes(page).getByRole('alert')).toBeHidden();
    });
  }
}

test('REQ-DET-03 unknown game is distinct from transient error and has no Retry', async ({ page }) => {
  await page.goto('/#/games/999');
  await expect(page.getByRole('alert').getByText('Game not found', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Patch notes', exact: true })).toBeHidden();
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search games' })).toBeVisible();
});

test('REQ-DET-04 notes 404 retains details, Back and no notes Retry', async ({ page }) => {
  await page.route('**/api/games/1/patch-notes', route => route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Game not found' } } }));
  await page.goto('/#/games/1');
  await orbit(page);
  await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
  await expect(notes(page).getByRole('alert').getByText('Game not found', { exact: true })).toBeVisible();
  await expect(notes(page).getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
  await orbit(page);
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search games' })).toBeVisible();
});

for (const resource of ['detail', 'notes'] as const) {
  for (const failure of [false, true]) {
    for (const destination of ['another game', 'catalogue']) {
      test(`REQ-DET-03/04 stale ${resource} ${failure ? 'failure' : 'success'} cannot replace ${destination}`, async ({ page }) => {
        const held = await holdGameOne(page, resource);
        await page.goto('/#/games/1');
        if (resource === 'notes') {
          await orbit(page);
          await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
        }
        await held.pending;
        await page.evaluate(() => { window.location.hash = '/games/6'; });
        await expect(page.getByRole('heading', { name: 'Ember Quest', exact: true })).toBeVisible();
        if (destination === 'catalogue') {
          await page.getByRole('link', { name: 'Back', exact: true }).click();
          await expect(page.getByRole('list', { name: 'Games' }).getByRole('link')).toHaveCount(10);
        } else {
          await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
          await expect(notes(page).getByRole('listitem')).toHaveText(['1.2.02026-09-20Added a quest journal.']);
        }
        await held.release(failure);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(destination === 'catalogue' ? 'Find your next world.' : 'Ember Quest');
        await expect(page.getByRole('alert')).toBeHidden();
        await expect(page.getByText('Fixed training arena navigation.', { exact: true })).toBeHidden();
      });
    }
  }
}

test('REQ-DET-03 persisted pagehide/pageshow remounts one fresh current route', async ({ page }) => {
  const held = await holdGameOne(page, 'detail');
  await page.goto('/#/games/1');
  await held.pending;
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.location.hash = '/games/6';
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ember Quest');
  await held.release(false);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ember Quest');
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your next world.');
  await expect(page.locator('#app > section')).toHaveCount(1);
});

test('REQ-A11Y-01 detail and note fixture text renders literally', async ({ page }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const literal = '<img id="injected-detail" src=x onerror="window.detailInjected=true">';
  const db = new DatabaseSync(dbPath);
  try {
    db.prepare('UPDATE games SET title=?, description=?, platforms=? WHERE id=1').run(literal, literal, JSON.stringify([literal]));
    db.prepare('UPDATE patch_notes SET version=?, summary=? WHERE id=2').run(literal, literal);
  } finally { db.close(); }
  const app = await startApp(dbPath);
  try {
    await page.goto(`${app.baseURL}/#/games/1`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(literal);
    await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
    await expect(notes(page).getByRole('listitem').first()).toContainText(literal);
    await expect(page.locator('#injected-detail')).toHaveCount(0);
    expect(await page.evaluate(() => 'detailInjected' in window)).toBe(false);
  } finally { await app.stop(); }
});
