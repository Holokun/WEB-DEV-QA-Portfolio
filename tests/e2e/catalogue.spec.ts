import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
import type { Page, Route } from '@playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { resetTestDatabase } from '../../app/db/reset.js';

const cards = (page: Page) => page.getByRole('list', { name: 'Games' }).getByRole('link');
async function expectTitles(page: Page, titles: string[]) {
  await expect(cards(page)).toHaveText(titles);
  await expect(page.getByRole('status')).toContainText(`${titles.length} games`);
}

test('TEST-UI-01 catalogue: seeded cards have ordered titles, genres and real game links', async ({ page }) => {
  await page.goto('/');
  await expectTitles(page, ['Atlas Tactics', 'Ember Quest', 'Ember Trail', 'Iron Citadel', 'Moss Garden', 'Neon Sprint', 'Orbit', 'ORBIT', 'Zeta', 'Écho']);
  await expect(page.getByRole('list', { name: 'Games' }).locator('.genre')).toHaveText(['Strategy', 'RPG', 'Adventure', 'Action', 'Puzzle', 'Racing', 'Action', 'RPG', 'Strategy', 'Puzzle']);
  await expect(cards(page).nth(0)).toHaveAttribute('href', '/#/games/10');
  await expect(page.getByLabel('Genre')).toHaveValue('');
  await expect(page.getByLabel('Genre').locator('option')).toHaveText(['All genres', 'Action', 'Adventure', 'Puzzle', 'Racing', 'RPG', 'Strategy']);
  await page.screenshot({ path: test.info().outputPath('catalogue.png'), fullPage: true });
});

test('TEST-UI-02/03 catalogue: search and genre intersect and clearing either preserves the other', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('textbox', { name: 'Search games' });
  const genre = page.getByLabel('Genre');
  await search.fill(' Ember ');
  await expectTitles(page, ['Ember Quest', 'Ember Trail']);
  await genre.selectOption('RPG');
  await expectTitles(page, ['Ember Quest']);
  await search.fill('');
  await expectTitles(page, ['Ember Quest', 'ORBIT']);
  await search.fill('Ember');
  await expectTitles(page, ['Ember Quest']);
  await genre.selectOption('');
  await expectTitles(page, ['Ember Quest', 'Ember Trail']);
});

test('TEST-UI-05 catalogue: zero matches exposes clear controls and restores results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Search games' }).fill('no-such-title');
  await expect(page.getByRole('status')).toContainText('No games found');
  await expect(cards(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear controls' }).click();
  await expect(cards(page)).toHaveCount(10);
});

test('TEST-UI-01 loading: initial held response shows a perceivable loading state', async ({ page }) => {
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/games', async route => { await hold; await route.continue(); });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Loading games');
  await expect(cards(page)).toHaveCount(0);
  release();
  await expect(cards(page)).toHaveCount(10);
});

for (const [label, character] of [['ASCII', 'a'], ['emoji', '🎮']] as const) {
  test(`TEST-UI-02: trimmed 80/81 ${label} boundary blocks all requests and retains valid results`, async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('textbox', { name: 'Search games' });
    await search.fill(' Ember ');
    await page.getByLabel('Genre').selectOption('RPG');
    await expectTitles(page, ['Ember Quest']);
    const requests: string[] = [];
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/games') requests.push(request.url()); });
    await search.fill(`  ${character.repeat(81)}  `);
    await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeVisible();
    await expect(search).toHaveAttribute('aria-invalid', 'true');
    const description = await search.getAttribute('aria-describedby');
    expect(description).toBeTruthy();
    await expect(page.locator(`#${description}`)).toContainText('80 characters');
    await page.getByLabel('Genre').selectOption('Action');
    await page.getByLabel('Genre').selectOption('');
    await page.getByLabel('Genre').selectOption('Action');
    await expectTitles(page, ['Ember Quest']);
    await expect(page.getByText('Results for search “Ember”; genre “RPG” · 1 games', { exact: true })).toBeVisible();
    expect(requests).toEqual([]);
    const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/games');
    await search.fill(`  ${character.repeat(80)}  `);
    const valid = new URL((await request).url());
    expect(valid.searchParams.get('search')).toBe(character.repeat(80));
    expect(valid.searchParams.get('genre')).toBe('Action');
    await expect(page.getByRole('status')).toContainText('No games found');
    await expect(search).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeHidden();
  });
}

for (const [search, titles] of [
  ['Orbit', ['Orbit', 'ORBIT']], ['ÉCH', ['Écho']], ['éch', []], ['echo', []], ["%' OR 1=1 --", []],
] as const) {
  test(`TEST-UI-02: literal ASCII-only search ${search}`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Search games' }).fill(search);
    await expectTitles(page, [...titles]);
  });
}

for (const failure of ['HTTP 500', 'network abort'] as const) {
  test(`TEST-UI-14 catalogue: ${failure} retains results, invalid input blocks Retry, then current controls recover`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Search games' }).fill('Ember');
    await expectTitles(page, ['Ember Quest', 'Ember Trail']);
    const fail = async (route: Route) => failure === 'HTTP 500'
      ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } })
      : route.abort('failed');
    await page.route('**/api/games?**', fail);
    await page.getByLabel('Genre').selectOption('RPG');
    await expect(page.getByRole('alert')).toContainText('Could not load games');
    await expect(cards(page)).toHaveText(['Ember Quest', 'Ember Trail']);
    await expect(page.getByText('Results for search “Ember”; genre “All genres” · 2 games', { exact: true })).toBeVisible();
    await expect(page.getByText('No games found', { exact: true })).toBeHidden();
    const requests: string[] = [];
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/games') requests.push(request.url()); });
    await page.getByRole('textbox', { name: 'Search games' }).fill('x'.repeat(81));
    await page.getByLabel('Genre').selectOption('Puzzle');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Could not load games');
    await expect(cards(page)).toHaveText(['Ember Quest', 'Ember Trail']);
    await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeVisible();
    expect(requests).toEqual([]);
    await page.getByRole('textbox', { name: 'Search games' }).fill('ÉCH');
    await expect(page.getByRole('alert')).toContainText('Could not load games');
    await page.unroute('**/api/games?**', fail);
    const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/games');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    const url = new URL((await request).url());
    expect(url.searchParams.get('search')).toBe('ÉCH');
    expect(url.searchParams.get('genre')).toBe('Puzzle');
    await expectTitles(page, ['Écho']);
    await expect(page.getByRole('alert')).toBeHidden();
  });
}

// Make cancellation ineffective to exercise ownership independently of fetch abort.
async function ignoreTransportCancellation(page: Page) {
  await page.addInitScript(() => {
    const fetchOriginal = window.fetch.bind(window);
    window.fetch = (input, init) => fetchOriginal(input, { ...init, signal: undefined });
  });
}
async function heldRequests(page: Page, keyForURL: (url: URL) => string = url => url.searchParams.get('search') ?? '') {
  const pending = new Map<string, { release(fail?: boolean): Promise<void> }>();
  await page.route('**/api/games**', async route => {
    const key = keyForURL(new URL(route.request().url()));
    const response = await route.fetch();
    let release!: (fail: boolean) => void;
    const wait = new Promise<boolean>(resolve => { release = resolve; });
    pending.set(key, { release: async (fail = false) => {
      const completed = page.waitForResponse(route.request().url());
      release(fail);
      await completed;
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => { resolve(); })));
    } });
    if (await wait) await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } });
    else await route.fulfill({ response });
  });
  return { async wait(key: string) { await expect.poll(() => pending.has(key)).toBe(true); return pending.get(key)!; } };
}

for (const olderFailure of [false, true]) {
  for (const latest of ['results', 'empty', 'error', 'loading'] as const) {
    test(`TEST-UI-04 stale ${olderFailure ? 'failure' : 'success'} cannot replace latest ${latest}`, async ({ page }) => {
      await ignoreTransportCancellation(page);
      await page.goto('/');
      await expect(cards(page)).toHaveCount(10);
      const held = await heldRequests(page);
      const search = page.getByRole('textbox', { name: 'Search games' });
      await search.fill('Ember');
      const old = await held.wait('Ember');
      const currentSearch = latest === 'empty' ? 'no-such-title' : 'Orbit';
      await search.fill(currentSearch);
      const current = await held.wait(currentSearch);
      if (latest !== 'loading') await current.release(latest === 'error');
      await old.release(olderFailure);
      if (latest === 'results') await expectTitles(page, ['Orbit', 'ORBIT']);
      if (latest === 'empty') { await expectTitles(page, []); await expect(page.getByRole('status')).toContainText('No games found'); }
      if (latest === 'error') { await expect(page.getByRole('alert')).toContainText('Could not load games'); await expect(cards(page)).toHaveCount(10); }
      if (latest === 'loading') {
        await expect(page.getByRole('status')).toContainText('Loading games');
        await expect(cards(page)).toHaveCount(10);
        await current.release();
        await expectTitles(page, ['Orbit', 'ORBIT']);
      }
      if (latest !== 'error') await expect(page.getByRole('alert')).toBeHidden();
    });
  }
}

for (const fail of [false, true]) {
  test(`TEST-UI-02: invalidating first request ignores its late ${fail ? 'failure' : 'success'}`, async ({ page }) => {
    await ignoreTransportCancellation(page);
    const held = await heldRequests(page);
    await page.goto('/');
    const first = await held.wait('');
    await page.getByRole('textbox', { name: 'Search games' }).fill('🎮'.repeat(81));
    await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeVisible();
    await first.release(fail);
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByRole('status')).not.toContainText('Loading');
    await expect(page.getByRole('alert')).toBeHidden();
  });
}

for (const [variant, initialSearch, finalSearch, finalGenre, expected] of [
  ['genre only', '', '', 'Action', ['Iron Citadel', 'Orbit']],
  ['combined controls', 'Ember', 'Orbit', 'Action', ['Orbit']],
  ['clearing search', 'Ember', '', 'RPG', ['Ember Quest', 'ORBIT']],
  ['clearing genre', 'Ember', 'Ember', '', ['Ember Quest', 'Ember Trail']],
] as const) {
  for (const fail of [false, true]) {
    test(`TEST-UI-04 ${variant}: late ${fail ? 'failure' : 'success'} preserves current controls`, async ({ page }) => {
      await ignoreTransportCancellation(page);
      await page.goto('/');
      await expect(cards(page)).toHaveCount(10);
      const held = await heldRequests(page, url => `${url.searchParams.get('search') ?? ''}|${url.searchParams.get('genre') ?? ''}`);
      // Change both controls in the same event turn for an unambiguous pair.
      await page.evaluate(({ search, genre }) => {
        document.querySelector<HTMLInputElement>('#game-search')!.value = search;
        const select = document.querySelector<HTMLSelectElement>('#game-genre')!;
        select.value = genre;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, { search: initialSearch, genre: 'RPG' });
      const old = await held.wait(`${initialSearch}|RPG`);
      await page.evaluate(({ search, genre }) => {
        document.querySelector<HTMLInputElement>('#game-search')!.value = search;
        const select = document.querySelector<HTMLSelectElement>('#game-genre')!;
        select.value = genre;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, { search: finalSearch, genre: finalGenre });
      const current = await held.wait(`${finalSearch}|${finalGenre}`);
      await current.release();
      await old.release(fail);
      await expectTitles(page, [...expected]);
      await expect(page.getByRole('textbox', { name: 'Search games' })).toHaveValue(finalSearch);
      await expect(page.getByLabel('Genre')).toHaveValue(finalGenre);
      await expect(page.getByRole('alert')).toBeHidden();
    });
  }
}

for (const fail of [false, true]) {
  test(`TEST-UI-02: invalidating a pending ${fail ? 'failure' : 'success'} retains earlier successful results`, async ({ page }) => {
    await ignoreTransportCancellation(page);
    await page.goto('/');
    await expect(cards(page)).toHaveCount(10);
    const held = await heldRequests(page);
    await page.getByRole('textbox', { name: 'Search games' }).fill('Ember');
    const old = await held.wait('Ember');
    await page.getByRole('textbox', { name: 'Search games' }).fill('x'.repeat(81));
    await old.release(fail);
    await expect(cards(page)).toHaveCount(10);
    await expect(page.getByRole('status')).toHaveText('10 games');
    await expect(page.getByText('Results for search “All titles”; genre “All genres” · 10 games', { exact: true })).toBeVisible();
    await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
  });
}

test('TEST-UI-12 catalogue: keyboard search, genre, link and Retry have visible focus and useful status', async ({ page }) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(10);
  await page.keyboard.press('Tab');
  const search = page.getByRole('textbox', { name: 'Search games' });
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS('outline-style', 'solid');
  await page.keyboard.type('Ember');
  await expectTitles(page, ['Ember Quest', 'Ember Trail']);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Genre')).toBeFocused();
  await expect(page.getByLabel('Genre')).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowUp');
  await expect(page.getByLabel('Genre')).toHaveValue('RPG');
  await expectTitles(page, ['Ember Quest']);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Clear controls' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cards(page).first()).toBeFocused();
  await expect(cards(page).first()).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/#\/games\/6$/);
  await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  const fail = (route: Route) => route.abort('failed');
  await page.route('**/api/games?**', fail);
  await search.focus();
  await search.fill('Orbit');
  await expect(page.getByRole('alert')).toContainText('Could not load games');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const retry = page.getByRole('button', { name: 'Retry', exact: true });
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS('outline-style', 'solid');
  await page.unroute('**/api/games?**', fail);
  await page.keyboard.press('Enter');
  await expectTitles(page, ['ORBIT']);
  await expect(search).toBeFocused();
});

test('REQ-A11Y-01 literal text: an isolated HTML-like database title never becomes markup', async ({ page }) => {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const literal = '<img id="injected-game" src=x onerror="window.gameInjected=true"><script>window.gameInjected=true</script>';
  const db = new DatabaseSync(dbPath);
  try { db.prepare('UPDATE games SET title=? WHERE id=1').run(literal); } finally { db.close(); }
  const app = await startApp(dbPath);
  try {
    await page.goto(app.baseURL);
    await expect(page.getByRole('link', { name: literal, exact: true })).toBeVisible();
    await expect(page.locator('#injected-game')).toHaveCount(0);
    expect(await page.evaluate(() => 'gameInjected' in window)).toBe(false);
    await expect(cards(page)).toHaveCount(10);
  } finally { await app.stop(); }
});

test('API client: non-2xx raises typed status/code and non-JSON preserves status', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/games?failure=*', route => new URL(route.request().url()).searchParams.get('failure') === 'json'
    ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } } })
    : route.fulfill({ status: 502, body: 'Unavailable', contentType: 'text/plain' }));
  const results = await page.evaluate(async moduleURL => {
    const { getJson, ApiRequestError } = await import(moduleURL);
    const results: unknown[] = [];
    for (const kind of ['json', 'plain']) {
      try { await getJson(`/api/games?failure=${kind}`); results.push('unexpected success'); }
      catch (error) {
        const value = error as { status?: number; code?: string };
        results.push({ typed: error instanceof ApiRequestError, status: value.status, code: value.code ?? null });
      }
    }
    return results;
  }, '/api-client.js');
  expect(results).toEqual([{ typed: true, status: 500, code: 'INTERNAL_ERROR' }, { typed: true, status: 502, code: null }]);
});

test('Catalogue destroy: removed view listeners and a late response cannot update retained DOM', async ({ page }) => {
  await ignoreTransportCancellation(page);
  await page.goto('/');
  await expect(cards(page)).toHaveCount(10);
  await page.evaluate(async moduleURL => {
    const { mountCatalogue } = await import(moduleURL);
    const host = document.createElement('div');
    host.id = 'cleanup-probe';
    document.body.append(host);
    let opened = 0;
    const mounted = mountCatalogue(host, { onOpenGame: () => { ++opened; } });
    (window as unknown as { cleanupProbe: unknown }).cleanupProbe = { host, mounted, opened: () => opened };
  }, '/catalogue.js');
  await expect(page.getByRole('list', { name: 'Games' }).nth(1).getByRole('link')).toHaveCount(10);
  const held = await heldRequests(page);
  await page.locator('#cleanup-probe input').fill('Ember');
  const old = await held.wait('Ember');
  await page.evaluate(() => {
    const probe = (window as unknown as { cleanupProbe: { host: HTMLElement; mounted: { destroy(): void }; opened(): number; view?: HTMLElement } }).cleanupProbe;
    probe.view = probe.host.firstElementChild as HTMLElement;
    probe.mounted.destroy();
  });
  await old.release();
  const requests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/games') requests.push(request.url()); });
  const snapshot = await page.evaluate(() => {
    const probe = (window as unknown as { cleanupProbe: { host: HTMLElement; opened(): number; view: HTMLElement } }).cleanupProbe;
    const search = probe.view.querySelector('input')!;
    search.value = 'Orbit';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    probe.view.querySelector('select')!.dispatchEvent(new Event('change', { bubbles: true }));
    probe.view.querySelector<HTMLButtonElement>('[data-clear]')!.click();
    probe.view.querySelector<HTMLAnchorElement>('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return { hostChildren: probe.host.childElementCount, titles: [...probe.view.querySelectorAll('a')].map(link => link.textContent), opened: probe.opened() };
  });
  expect(snapshot).toEqual({ hostChildren: 0, titles: ['Atlas Tactics', 'Ember Quest', 'Ember Trail', 'Iron Citadel', 'Moss Garden', 'Neon Sprint', 'Orbit', 'ORBIT', 'Zeta', 'Écho'], opened: 0 });
  expect(requests).toEqual([]);
});
