// Focused, assistant-executed checks; never relabel these as Vadim's manual work.
// From the repository root: pnpm build, then node <this file> [output-directory].
// The default output stays ignored so reruns do not overwrite recorded evidence.
import { chromium, firefox, expect } from '@playwright/test';
import { ownedDatabase, startApp } from '../../../../dist/tests/fixtures/app.js';
import { basename, dirname, join, resolve } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { release } from 'node:os';

const output = resolve(process.argv[2] ?? `test-results/session-follow-up-${Date.now()}`);
const requestedIds = process.argv[3]?.split(',');
mkdirSync(output, { recursive: true });
const sourceFiles = ['package.json', 'pnpm-lock.yaml', 'playwright.config.ts',
  'app/ui/catalogue.ts', 'app/ui/detail.ts', 'app/ui/main.ts', 'app/ui/styles.css',
  'app/api/games.ts', 'app/db/seed.ts', 'tests/fixtures/app.ts'];
const hashes = () => Object.fromEntries(sourceFiles.map(path => [path,
  createHash('sha256').update(readFileSync(path)).digest('hex')]));
const allIds = [10, 6, 5, 8, 9, 7, 1, 2, 4, 3];
const expectedTitles = ['Atlas Tactics', 'Ember Quest', 'Ember Trail', 'Iron Citadel',
  'Moss Garden', 'Neon Sprint', 'Orbit', 'ORBIT', 'Zeta', 'Écho'];
const report = {
  kind: 'Assistant-executed Playwright follow-up; separate from human manual results',
  startedAtUtc: new Date().toISOString(),
  environment: { node: process.version, os: `${process.platform} ${release()}`,
    playwright: JSON.parse(readFileSync('node_modules/@playwright/test/package.json')).version,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    workingTreeStatus: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }),
    fixture: 'v1; unchanged synthetic games and notes',
    databasePath: ownedDatabase(), separateDatabase: true, browsers: {} },
  sourceHashesBefore: hashes(), checks: [],
  networkFailureSimulationExecuted: false,
  scopeExclusions: ['HTTP 500 and network failure/Retry (user requested no repeat)',
    'screen-reader announcements', 'axe/WCAG assessment', 'request races',
    'favourites and feedback', 'WebKit', 'physical mobile devices',
    'complete 66-check Firefox suite'],
};
let app;
const browsers = {};
const cards = page => page.getByRole('list', { name: 'Games' }).getByRole('link');
const search = page => page.getByRole('textbox', { name: 'Search games' });
const genre = page => page.getByLabel('Genre', { exact: true });
const validationCopy = 'Search must be 80 characters or fewer';
async function uiIds(page) {
  return cards(page).evaluateAll(links => links.map(link => Number(link.dataset.gameId)));
}
async function catalogue(page) {
  await page.goto(app.baseURL);
  await expect(cards(page)).toHaveCount(10);
  await expect(page.getByRole('status')).toHaveText('10 games');
  expect(await uiIds(page)).toEqual(allIds);
}
async function query(page, text, selectedGenre, expectedIds) {
  // Set genre first, then one complete input event. Observe the real final request.
  if (await genre(page).inputValue() !== selectedGenre) {
    const response = page.waitForResponse(r => {
      const url = new URL(r.url());
      return url.pathname === '/api/games' && (url.searchParams.get('genre') ?? '') === selectedGenre;
    });
    await genre(page).selectOption(selectedGenre);
    await response;
    await expect(page.getByRole('status')).not.toContainText('Loading');
  }
  const trimmed = text.trim();
  const pending = page.waitForResponse(r => {
    const url = new URL(r.url());
    return url.pathname === '/api/games' && (url.searchParams.get('search') ?? '') === trimmed
      && (url.searchParams.get('genre') ?? '') === selectedGenre;
  });
  await search(page).fill(text);
  const response = await pending;
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body.filters).toEqual({ search: trimmed, genre: selectedGenre });
  expect(body.games.map(game => game.id)).toEqual(expectedIds);
  expect(body.total).toBe(expectedIds.length);
  await expect(cards(page)).toHaveCount(expectedIds.length);
  await expect(page.getByRole('status')).toHaveText(expectedIds.length
    ? `${expectedIds.length} games` : '0 games · No games found');
  expect(await uiIds(page)).toEqual(expectedIds);
  await expect(search(page)).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText(validationCopy, { exact: true })).toBeHidden();
  return { input: text, codePoints: Array.from(text).length,
    trimmedCodePoints: Array.from(trimmed).length, url: response.url(),
    status: response.status(), body, uiIds: await uiIds(page) };
}
async function screenshot(page, result, suffix) {
  const filename = `${result.id}-${suffix}.png`;
  await page.screenshot({ path: join(output, filename), fullPage: true });
  result.screenshots.push(filename);
}
async function check(id, title, requirements, scenario, browserName, viewport, action) {
  if (requestedIds && !requestedIds.includes(id)) return;
  const result = { id, title, requirements, scenario, browserName, viewport,
    startedAtUtc: new Date().toISOString(), screenshots: [], observations: {},
    console: [], pageErrors: [], apiRequests: [], apiResponses: [] };
  report.checks.push(result);
  const context = await browsers[browserName].newContext({ viewport });
  const page = await context.newPage();
  page.on('console', message => {
    if (message.type() === 'warning' || message.type() === 'error')
      result.console.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', error => result.pageErrors.push(String(error)));
  const responseTasks = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/'))
      result.apiRequests.push({ url: request.url(), method: request.method() });
  });
  page.on('response', response => {
    if (!new URL(response.url()).pathname.startsWith('/api/')) return;
    responseTasks.push((async () => {
      try { result.apiResponses.push({ url: response.url(), status: response.status(), body: await response.json() }); }
      catch (error) { result.apiResponses.push({ url: response.url(), status: response.status(), captureError: String(error) }); }
    })());
  });
  try {
    await action(page, result);
    result.outcome = 'passed';
  } catch (error) {
    result.outcome = 'failed'; result.error = String(error.stack ?? error); process.exitCode = 1;
    try { await screenshot(page, result, 'failure'); } catch {}
  } finally {
    await Promise.allSettled(responseTasks);
    await context.close();
    result.finishedAtUtc = new Date().toISOString();
    console.log(`${result.outcome}: ${id} ${browserName} ${title}`);
    writeFileSync(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  }
}
const desktop = { width: 1280, height: 800 };
async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth,
    document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  return dimensions;
}
async function focus(page, locator, label) {
  await expect(locator).toBeFocused();
  const state = await locator.evaluate(element => {
    const css = getComputedStyle(element);
    return { text: element.textContent, focusVisible: element.matches(':focus-visible'),
      outlineStyle: css.outlineStyle, outlineWidth: css.outlineWidth,
      outlineColor: css.outlineColor, outlineOffset: css.outlineOffset };
  });
  expect(state.focusVisible).toBe(true);
  expect(state.outlineStyle).toBe('solid');
  expect(parseFloat(state.outlineWidth)).toBeGreaterThan(0);
  return { label, ...state };
}
try {
  app = await startApp(report.environment.databasePath);
  report.environment.baseURL = app.baseURL;
  const firefoxExecutable = join(process.cwd(), '.playwright-browsers',
    basename(dirname(dirname(firefox.executablePath()))), 'firefox', 'firefox.exe');
  browsers.firefox = await firefox.launch({ headless: true, executablePath: firefoxExecutable });
  browsers.chromium = await chromium.launch({ headless: true });
  report.environment.browsers = {
    firefox: { version: browsers.firefox.version(), executable: firefoxExecutable, headless: true },
    chromium: { version: browsers.chromium.version(), executable: chromium.executablePath(), headless: true },
  };
  await check('FOLLOWUP-01', 'Seeded catalogue order, labels and count', ['REQ-CAT-01'], 'SCN-CAT-01 / loaded state', 'firefox', desktop, async (page, result) => {
    await catalogue(page);
    await expect(cards(page)).toHaveText(expectedTitles);
    result.observations = { ids: await uiIds(page), titles: await cards(page).allTextContents(),
      genres: await page.getByRole('list', { name: 'Games' }).locator('.genre').allTextContents(), count: 10 };
    expect(result.observations.genres).toEqual(['Strategy', 'RPG', 'Adventure', 'Action', 'Puzzle', 'Racing', 'Action', 'RPG', 'Strategy', 'Puzzle']);
    await screenshot(page, result, 'catalogue');
  });
  for (const [id, title, value] of [
    ['FOLLOWUP-02', '79 ASCII code points accepted', 'a'.repeat(79)],
    ['FOLLOWUP-03', '80 ASCII code points accepted', 'a'.repeat(80)],
    ['FOLLOWUP-04', 'Whitespace trimmed before 80-code-point validation', `  ${'a'.repeat(80)}  `],
    ['FOLLOWUP-05', '80 emoji are 80 code points', '🎮'.repeat(80)],
  ]) {
    await check(id, title, ['REQ-CAT-02', 'REQ-CAT-05'], 'SCN-CAT-03 / accepted boundary', 'firefox', desktop, async (page, result) => {
      await catalogue(page);
      result.observations = await query(page, value, '', []);
      await screenshot(page, result, 'accepted');
    });
  }
  for (const [id, title, value] of [
    ['FOLLOWUP-06', '81 ASCII: retain results; defer genre; recover', 'a'.repeat(81)],
    ['FOLLOWUP-07', '81 emoji: retain results; defer genre; recover', '🎮'.repeat(81)],
  ]) {
    await check(id, title, ['REQ-CAT-02', 'REQ-CAT-03', 'REQ-CAT-04'], 'SCN-CAT-03 / invalid boundary and recovery', 'firefox', desktop, async (page, result) => {
      await catalogue(page);
      const baseline = await query(page, 'Ember', '', [6, 5]);
      const summary = await page.locator('.result-summary').textContent();
      const requests = [];
      const listener = request => { if (new URL(request.url()).pathname === '/api/games') requests.push(request.url()); };
      page.on('request', listener);
      await search(page).fill(value);
      await expect(search(page)).toHaveValue(value);
      await expect(search(page)).toHaveAttribute('aria-invalid', 'true');
      await expect(search(page)).toHaveAttribute('aria-describedby', 'search-validation');
      await expect(page.getByText(validationCopy, { exact: true })).toBeVisible();
      await expect(page.locator('#search-validation')).toHaveAttribute('aria-live', 'polite');
      const deferredGenres = [];
      for (const selectedGenre of ['Strategy', '', 'RPG']) {
        await genre(page).selectOption(selectedGenre);
        await expect(genre(page)).toHaveValue(selectedGenre);
        await expect(cards(page)).toHaveText(['Ember Quest', 'Ember Trail']);
        await expect(page.getByRole('status')).toHaveText('2 games');
        await expect(page.locator('.result-summary')).toHaveText(summary);
        deferredGenres.push({ selectedGenre, retainedIds: await uiIds(page), retainedSummary: summary });
      }
      // Validation and request suppression are synchronous input/change handling.
      // Two rendering frames bound this negative assertion; this is not a load test.
      await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
      expect(requests).toEqual([]);
      result.observations = { baseline, input: value, codePoints: Array.from(value).length,
        fullValueRetained: await search(page).inputValue(), validation: validationCopy,
        invalidRequests: [...requests], deferredGenres,
        validationAssociation: await search(page).getAttribute('aria-describedby') };
      await screenshot(page, result, 'invalid-retained-results');
      page.off('request', listener);
      result.observations.recovery = await query(page, 'Ember', 'RPG', [6]);
    });
  }
  await check('FOLLOWUP-08', 'ASCII folding, Unicode, digits and literal symbols', ['REQ-CAT-02', 'REQ-CAT-05'], 'SCN-CAT-02 / literal matching', 'firefox', desktop, async (page, result) => {
    await catalogue(page);
    const variants = [];
    for (const [value, expected] of [['ÉCH', [3]], ['éch', []], ['echo', []], ['oRbIt', [1, 2]], ['<>&', []], ['0', []], ['1', []]])
      variants.push(await query(page, value, '', expected));
    result.observations = { variants };
    await screenshot(page, result, 'no-results');
  });
  await check('FOLLOWUP-09', 'All six genres return exact fixture IDs', ['REQ-CAT-03'], 'SCN-CAT-02 / all genres', 'firefox', desktop, async (page, result) => {
    await catalogue(page);
    const variants = [];
    for (const [selectedGenre, ids] of [['Action', [8, 1]], ['Adventure', [5]], ['Puzzle', [9, 3]], ['Racing', [7]], ['RPG', [6, 2]], ['Strategy', [10, 4]]]) {
      const pending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/games'
        && new URL(r.url()).searchParams.get('genre') === selectedGenre);
      await genre(page).selectOption(selectedGenre);
      const response = await pending; const body = await response.json();
      expect(response.status()).toBe(200); expect(body.games.map(game => game.id)).toEqual(ids);
      await expect(page.getByRole('status')).toHaveText(`${ids.length} games`);
      await expect(cards(page)).toHaveCount(ids.length); expect(await uiIds(page)).toEqual(ids);
      variants.push({ genre: selectedGenre, status: response.status(), url: response.url(), body, uiIds: await uiIds(page) });
    }
    result.observations = { variants };
  });
  await check('FOLLOWUP-10', 'AND matching and independently clearing controls', ['REQ-CAT-02', 'REQ-CAT-03', 'REQ-CAT-04', 'REQ-CAT-05'], 'SCN-CAT-02 / combined and clearing', 'firefox', desktop, async (page, result) => {
    await catalogue(page);
    const steps = [];
    for (const text of ['At', 'Atl', 'Atla', 'Atlas']) steps.push(await query(page, text, 'Strategy', [10]));
    steps.push(await query(page, 'Orbit', 'RPG', [2]));
    steps.push(await query(page, '', 'RPG', [6, 2]));
    steps.push(await query(page, 'Orbit', 'RPG', [2]));
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/games'
      && new URL(r.url()).searchParams.get('search') === 'Orbit' && !new URL(r.url()).searchParams.has('genre'));
    await genre(page).selectOption('');
    const response = await pending;
    await expect(cards(page)).toHaveText(['Orbit', 'ORBIT']);
    expect(await search(page).inputValue()).toBe('Orbit');
    const body = await response.json(); expect(body.games.map(game => game.id)).toEqual([1, 2]);
    expect(response.status()).toBe(200);
    steps.push({ action: 'clear genre only', status: response.status(), body, searchRetained: 'Orbit' });
    await page.getByRole('button', { name: 'Clear controls' }).click();
    await expect(search(page)).toHaveValue(''); await expect(genre(page)).toHaveValue('');
    await expect(cards(page)).toHaveText(expectedTitles);
    await expect(page.getByRole('status')).toHaveText('10 games');
    expect(await uiIds(page)).toEqual(allIds);
    steps.push({ action: 'Clear controls', ids: await uiIds(page), count: 10 });
    result.observations = { steps };
  });
  await check('FOLLOWUP-11', 'Orbit detail fields and exact patch-note ordering', ['REQ-DET-01', 'REQ-DET-02'], 'SCN-DET-01 / ordered notes', 'firefox', desktop, async (page, result) => {
    await catalogue(page);
    const detailPending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/games/1');
    await page.getByRole('link', { name: 'Orbit', exact: true }).click();
    const detailResponse = await detailPending; expect(detailResponse.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
    await expect(page.getByText('Defend a tiny space station from drifting robots.', { exact: true })).toBeVisible();
    await expect(page.locator('[data-year]')).toHaveText('2018');
    await expect(page.locator('[data-platforms]')).toHaveText('Windows, Linux');
    const notesPending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/games/1/patch-notes');
    await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
    const notesResponse = await notesPending; const body = await notesResponse.json();
    expect(notesResponse.status()).toBe(200);
    expect(body.patchNotes).toEqual([
      { id: 2, gameId: 1, version: '1.1.1', summary: 'Fixed training arena navigation.', publishedAt: '2026-09-01' },
      { id: 1, gameId: 1, version: '1.1.0', summary: 'Added a training arena.', publishedAt: '2026-09-01' },
      { id: 3, gameId: 1, version: '1.0.0', summary: 'Initial release.', publishedAt: '2026-08-01' },
    ]);
    const area = page.getByRole('region', { name: 'Patch notes' });
    await expect(area.getByRole('heading', { level: 3 })).toHaveText(['1.1.1', '1.1.0', '1.0.0']);
    await expect(area.locator('time')).toHaveText(['2026-09-01', '2026-09-01', '2026-08-01']);
    expect(await area.getByRole('listitem').evaluateAll(items => items.map(item => Number(item.dataset.noteId)))).toEqual([2, 1, 3]);
    result.observations = { detail: await detailResponse.json(), patchNotes: body, status: notesResponse.status(), gameId: 1 };
    await screenshot(page, result, 'ordered-notes');
    await page.getByRole('link', { name: 'Back', exact: true }).click();
    await expect(cards(page)).toHaveText(expectedTitles);
  });
  await check('FOLLOWUP-12', 'Moss Garden has explicit empty patch notes', ['REQ-DET-01', 'REQ-DET-02'], 'SCN-DET-01 / no notes', 'firefox', desktop, async (page, result) => {
    await catalogue(page);
    await page.getByRole('link', { name: 'Moss Garden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Moss Garden', exact: true })).toBeVisible();
    const pending = page.waitForResponse(r => new URL(r.url()).pathname === '/api/games/9/patch-notes');
    await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
    const response = await pending; const body = await response.json();
    expect(response.status()).toBe(200); expect(body).toEqual({ patchNotes: [] });
    const area = page.getByRole('region', { name: 'Patch notes' });
    await expect(area.getByRole('status')).toHaveText('No patch notes available');
    await expect(area.getByRole('listitem')).toHaveCount(0);
    result.observations = { gameId: 9, url: response.url(), status: response.status(), body,
      message: await area.getByRole('status').textContent() };
    await screenshot(page, result, 'empty-notes');
  });
  for (const [id, browserName] of [['FOLLOWUP-13', 'firefox'], ['FOLLOWUP-14', 'chromium']]) {
    await check(id, 'Keyboard-only controls, navigation and visible focus', ['REQ-A11Y-01'], 'SCN-A11Y-01 / first-slice successful keyboard path', browserName, desktop, async (page, result) => {
      await catalogue(page);
      const focuses = [];
      await page.keyboard.press('Tab'); focuses.push(await focus(page, search(page), 'Search games'));
      await page.keyboard.type('Orbit');
      await expect(cards(page)).toHaveText(['Orbit', 'ORBIT']);
      await page.keyboard.press('Tab'); focuses.push(await focus(page, genre(page), 'Genre'));
      await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      await expect(genre(page)).toHaveValue('Action');
      await expect(cards(page)).toHaveText(['Orbit']);
      await screenshot(page, result, 'genre-focus');
      await page.keyboard.press('Tab'); focuses.push(await focus(page, page.getByRole('button', { name: 'Clear controls' }), 'Clear controls'));
      await page.keyboard.press('Enter');
      await expect(cards(page)).toHaveText(expectedTitles);
      await expect(search(page)).toBeFocused();
      await page.keyboard.type('Orbit'); await expect(cards(page)).toHaveText(['Orbit', 'ORBIT']);
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      focuses.push(await focus(page, page.getByRole('link', { name: 'Orbit', exact: true }), 'Orbit'));
      await screenshot(page, result, 'game-focus');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
      await page.keyboard.press('Tab'); focuses.push(await focus(page, page.getByRole('link', { name: 'Back', exact: true }), 'Back'));
      await page.keyboard.press('Tab'); focuses.push(await focus(page, page.getByRole('link', { name: 'Patch notes', exact: true }), 'Patch notes'));
      await screenshot(page, result, 'notes-focus');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('region', { name: 'Patch notes' }).getByRole('listitem')).toHaveCount(3);
      await page.keyboard.press('Shift+Tab'); focuses.push(await focus(page, page.getByRole('link', { name: 'Patch notes', exact: true }), 'Patch notes reverse'));
      await page.keyboard.press('Shift+Tab'); focuses.push(await focus(page, page.getByRole('link', { name: 'Back', exact: true }), 'Back reverse'));
      await page.keyboard.press('Enter');
      await expect(cards(page)).toHaveText(expectedTitles);
      result.observations = { focuses, inputMethod: 'Playwright real keyboard events only after initial navigation',
        genreOperation: 'Home, ArrowDown, Enter selects Action', returnedToCatalogue: true,
        screenReaderExecuted: false, retryKeyboardExecuted: false };
    });
  }
  for (const [id, browserName, viewport] of [
    ['FOLLOWUP-15', 'firefox', desktop],
    ['FOLLOWUP-16', 'firefox', { width: 766, height: 577 }],
    ['FOLLOWUP-17', 'chromium', { width: 375, height: 812 }],
  ]) {
    await check(id, 'Viewport usability: catalogue, search, validation, detail and notes', ['REQ-LAY-01'], 'SCN-LAY-01 / first-slice normal and validation states', browserName, viewport, async (page, result) => {
      await catalogue(page);
      const dimensions = [{ state: 'catalogue', ...await noOverflow(page) }];
      await screenshot(page, result, 'catalogue');
      const controls = [];
      for (const locator of [search(page), genre(page), page.getByRole('button', { name: 'Clear controls' })]) {
        await expect(locator).toBeVisible(); const box = await locator.boundingBox();
        expect(box).not.toBeNull(); expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.height).toBeGreaterThanOrEqual(44); controls.push(box);
      }
      await query(page, 'Orbit', 'Action', [1]);
      dimensions.push({ state: 'filtered catalogue', ...await noOverflow(page) });
      await search(page).fill('a'.repeat(81));
      await expect(page.getByText(validationCopy, { exact: true })).toBeVisible();
      dimensions.push({ state: 'overlong validation', ...await noOverflow(page) });
      await screenshot(page, result, 'validation');
      await query(page, 'Orbit', 'Action', [1]);
      await page.getByRole('link', { name: 'Orbit', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible();
      dimensions.push({ state: 'details', ...await noOverflow(page) });
      await page.getByRole('link', { name: 'Patch notes', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Patch notes' }).getByRole('listitem')).toHaveCount(3);
      dimensions.push({ state: 'notes', ...await noOverflow(page) });
      await screenshot(page, result, 'detail-notes');
      await page.getByRole('link', { name: 'Back', exact: true }).click();
      await expect(cards(page)).toHaveText(expectedTitles);
      result.observations = { dimensions, controlBounds: controls, returnedToCatalogue: true,
        physicalDevice: false, pendingOrNetworkErrorStatesExecuted: false };
    });
  }
} catch (error) {
  report.setupError = String(error.stack ?? error); process.exitCode = 1;
} finally {
  report.cleanup = {};
  for (const [name, browser] of Object.entries(browsers)) {
    try { await browser.close(); report.cleanup[name] = 'closed'; }
    catch (error) { report.cleanup[name] = String(error); process.exitCode = 1; }
  }
  try { if (app) { await app.stop(); report.cleanup.app = 'stopped'; } }
  catch (error) { report.cleanup.app = String(error); process.exitCode = 1; }
  report.sourceHashesAfter = hashes();
  report.sourcesUnchanged = JSON.stringify(report.sourceHashesBefore) === JSON.stringify(report.sourceHashesAfter);
  if (!report.sourcesUnchanged) process.exitCode = 1;
  report.finishedAtUtc = new Date().toISOString();
  report.durationSeconds = (Date.parse(report.finishedAtUtc) - Date.parse(report.startedAtUtc)) / 1000;
  report.counts = { checkGroups: report.checks.length,
    passed: report.checks.filter(check => check.outcome === 'passed').length,
    failed: report.checks.filter(check => check.outcome !== 'passed').length };
  report.outcome = !report.setupError && report.counts.checkGroups === (requestedIds?.length ?? 17)
    && report.counts.failed === 0 && !process.exitCode ? 'passed' : 'failed';
  if (report.outcome !== 'passed') process.exitCode = 1;
  writeFileSync(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ outcome: report.outcome, ...report.counts,
    durationSeconds: report.durationSeconds, browsers: report.environment.browsers,
    sourcesUnchanged: report.sourcesUnchanged, cleanup: report.cleanup, setupError: report.setupError, output }));
}
