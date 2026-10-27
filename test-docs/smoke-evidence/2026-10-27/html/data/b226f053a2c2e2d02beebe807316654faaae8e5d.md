# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\catalogue.spec.ts >> TEST-UI-01 catalogue: seeded cards have ordered titles, genres and real game links @smoke
- Location: tests\e2e\catalogue.spec.ts:12:1

# Error details

```
Error: page.screenshot: Protocol error (Page.captureScreenshot): Unable to capture screenshot
Call log:
  - taking page screenshot
  - waiting for fonts to load...
  - fonts loaded

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]: Game Companion
    - navigation "Main" [ref=e4]:
      - link "Library" [ref=e5] [cursor=pointer]:
        - /url: /
      - link "Favourites (0)" [ref=e6] [cursor=pointer]:
        - /url: /#/favourites
      - link "Feedback" [ref=e7] [cursor=pointer]:
        - /url: /#/feedback
  - main [active] [ref=e8]:
    - generic [ref=e9]:
      - paragraph [ref=e10]: THE LIBRARY
      - heading "Find your next world." [level=1] [ref=e11]
      - paragraph [ref=e12]: Explore the collection by title or genre.
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Search games
          - textbox "Search games" [ref=e16]:
            - /placeholder: Try Ember or Orbit
          - paragraph
        - generic [ref=e17]:
          - generic [ref=e18]: Genre
          - combobox "Genre" [ref=e19]:
            - option "All genres" [selected]
            - option "Action"
            - option "Adventure"
            - option "Puzzle"
            - option "Racing"
            - option "RPG"
            - option "Strategy"
        - button "Clear controls" [ref=e20] [cursor=pointer]
      - status [ref=e21]: 10 games
      - paragraph [ref=e22]: Results for search “All titles”; genre “All genres” · 10 games
      - list "Games" [ref=e23]:
        - listitem [ref=e24]:
          - link "Atlas Tactics" [ref=e25] [cursor=pointer]:
            - /url: /#/games/10
          - paragraph [ref=e26]: Strategy
          - button "Add Atlas Tactics to favourites" [ref=e27] [cursor=pointer]
        - listitem [ref=e28]:
          - link "Ember Quest" [ref=e29] [cursor=pointer]:
            - /url: /#/games/6
          - paragraph [ref=e30]: RPG
          - button "Add Ember Quest to favourites" [ref=e31] [cursor=pointer]
        - listitem [ref=e32]:
          - link "Ember Trail" [ref=e33] [cursor=pointer]:
            - /url: /#/games/5
          - paragraph [ref=e34]: Adventure
          - button "Add Ember Trail to favourites" [ref=e35] [cursor=pointer]
        - listitem [ref=e36]:
          - link "Iron Citadel" [ref=e37] [cursor=pointer]:
            - /url: /#/games/8
          - paragraph [ref=e38]: Action
          - button "Add Iron Citadel to favourites" [ref=e39] [cursor=pointer]
        - listitem [ref=e40]:
          - link "Moss Garden" [ref=e41] [cursor=pointer]:
            - /url: /#/games/9
          - paragraph [ref=e42]: Puzzle
          - button "Add Moss Garden to favourites" [ref=e43] [cursor=pointer]
        - listitem [ref=e44]:
          - link "Neon Sprint" [ref=e45] [cursor=pointer]:
            - /url: /#/games/7
          - paragraph [ref=e46]: Racing
          - button "Add Neon Sprint to favourites" [ref=e47] [cursor=pointer]
        - listitem [ref=e48]:
          - link "Orbit" [ref=e49] [cursor=pointer]:
            - /url: /#/games/1
          - paragraph [ref=e50]: Action
          - button "Add Orbit to favourites" [ref=e51] [cursor=pointer]
        - listitem [ref=e52]:
          - link "ORBIT" [ref=e53] [cursor=pointer]:
            - /url: /#/games/2
          - paragraph [ref=e54]: RPG
          - button "Add ORBIT to favourites" [ref=e55] [cursor=pointer]
        - listitem [ref=e56]:
          - link "Zeta" [ref=e57] [cursor=pointer]:
            - /url: /#/games/4
          - paragraph [ref=e58]: Strategy
          - button "Add Zeta to favourites" [ref=e59] [cursor=pointer]
        - listitem [ref=e60]:
          - link "Écho" [ref=e61] [cursor=pointer]:
            - /url: /#/games/3
          - paragraph [ref=e62]: Puzzle
          - button "Add Écho to favourites" [ref=e63] [cursor=pointer]
  - contentinfo [ref=e64]: Ten fictional worlds. A local catalogue for exploring and testing.
```

# Test source

```ts
  1   | import { test, expect, ownedDatabase, startApp } from '../fixtures/app.js';
  2   | import type { Page, Route } from '@playwright/test';
  3   | import { DatabaseSync } from 'node:sqlite';
  4   | import { resetTestDatabase } from '../../app/db/reset.js';
  5   | 
  6   | const cards = (page: Page) => page.getByRole('list', { name: 'Games' }).getByRole('link');
  7   | async function expectTitles(page: Page, titles: string[]) {
  8   |   await expect(cards(page)).toHaveText(titles);
  9   |   await expect(page.getByRole('status')).toContainText(`${titles.length} games`);
  10  | }
  11  | 
  12  | test('TEST-UI-01 catalogue: seeded cards have ordered titles, genres and real game links @smoke', async ({ page }) => {
  13  |   await page.goto('/');
  14  |   await expectTitles(page, ['Atlas Tactics', 'Ember Quest', 'Ember Trail', 'Iron Citadel', 'Moss Garden', 'Neon Sprint', 'Orbit', 'ORBIT', 'Zeta', 'Écho']);
  15  |   await expect(page.getByRole('list', { name: 'Games' }).locator('.genre')).toHaveText(['Strategy', 'RPG', 'Adventure', 'Action', 'Puzzle', 'Racing', 'Action', 'RPG', 'Strategy', 'Puzzle']);
  16  |   await expect(cards(page).nth(0)).toHaveAttribute('href', '/#/games/10');
  17  |   await expect(page.getByLabel('Genre')).toHaveValue('');
  18  |   await expect(page.getByLabel('Genre').locator('option')).toHaveText(['All genres', 'Action', 'Adventure', 'Puzzle', 'Racing', 'RPG', 'Strategy']);
> 19  |   await page.screenshot({ path: test.info().outputPath('catalogue.png'), fullPage: true });
      |              ^ Error: page.screenshot: Protocol error (Page.captureScreenshot): Unable to capture screenshot
  20  | });
  21  | 
  22  | test('TEST-UI-02/03 catalogue: search and genre intersect and clearing either preserves the other @smoke', async ({ page }) => {
  23  |   await page.goto('/');
  24  |   const search = page.getByRole('textbox', { name: 'Search games' });
  25  |   const genre = page.getByLabel('Genre');
  26  |   await search.fill(' Ember ');
  27  |   await expectTitles(page, ['Ember Quest', 'Ember Trail']);
  28  |   await genre.selectOption('RPG');
  29  |   await expectTitles(page, ['Ember Quest']);
  30  |   await search.fill('');
  31  |   await expectTitles(page, ['Ember Quest', 'ORBIT']);
  32  |   await search.fill('Ember');
  33  |   await expectTitles(page, ['Ember Quest']);
  34  |   await genre.selectOption('');
  35  |   await expectTitles(page, ['Ember Quest', 'Ember Trail']);
  36  | });
  37  | 
  38  | test('TEST-UI-05 catalogue: zero matches exposes clear controls and restores results', async ({ page }) => {
  39  |   await page.goto('/');
  40  |   await page.getByRole('textbox', { name: 'Search games' }).fill('no-such-title');
  41  |   await expect(page.getByRole('status')).toContainText('No games found');
  42  |   await expect(cards(page)).toHaveCount(0);
  43  |   await page.getByRole('button', { name: 'Clear controls' }).click();
  44  |   await expect(cards(page)).toHaveCount(10);
  45  | });
  46  | 
  47  | test('TEST-UI-01 loading: initial held response shows a perceivable loading state', async ({ page }) => {
  48  |   let release!: () => void;
  49  |   const hold = new Promise<void>(resolve => { release = resolve; });
  50  |   await page.route('**/api/games', async route => { await hold; await route.continue(); });
  51  |   await page.goto('/');
  52  |   await expect(page.getByRole('status')).toContainText('Loading games');
  53  |   await expect(cards(page)).toHaveCount(0);
  54  |   release();
  55  |   await expect(cards(page)).toHaveCount(10);
  56  | });
  57  | 
  58  | for (const [label, character] of [['ASCII', 'a'], ['emoji', '🎮']] as const) {
  59  |   test(`TEST-UI-02: trimmed 80/81 ${label} boundary blocks all requests and retains valid results`, async ({ page }) => {
  60  |     await page.goto('/');
  61  |     const search = page.getByRole('textbox', { name: 'Search games' });
  62  |     await search.fill(' Ember ');
  63  |     await page.getByLabel('Genre').selectOption('RPG');
  64  |     await expectTitles(page, ['Ember Quest']);
  65  |     const requests: string[] = [];
  66  |     page.on('request', request => { if (new URL(request.url()).pathname === '/api/games') requests.push(request.url()); });
  67  |     await search.fill(`  ${character.repeat(81)}  `);
  68  |     await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeVisible();
  69  |     await expect(search).toHaveAttribute('aria-invalid', 'true');
  70  |     const description = await search.getAttribute('aria-describedby');
  71  |     expect(description).toBeTruthy();
  72  |     await expect(page.locator(`#${description}`)).toContainText('80 characters');
  73  |     await page.getByLabel('Genre').selectOption('Action');
  74  |     await page.getByLabel('Genre').selectOption('');
  75  |     await page.getByLabel('Genre').selectOption('Action');
  76  |     await expectTitles(page, ['Ember Quest']);
  77  |     await expect(page.getByText('Results for search “Ember”; genre “RPG” · 1 games', { exact: true })).toBeVisible();
  78  |     expect(requests).toEqual([]);
  79  |     const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/games');
  80  |     await search.fill(`  ${character.repeat(80)}  `);
  81  |     const valid = new URL((await request).url());
  82  |     expect(valid.searchParams.get('search')).toBe(character.repeat(80));
  83  |     expect(valid.searchParams.get('genre')).toBe('Action');
  84  |     await expect(page.getByRole('status')).toContainText('No games found');
  85  |     await expect(search).not.toHaveAttribute('aria-invalid', 'true');
  86  |     await expect(page.getByText('Search must be 80 characters or fewer', { exact: true })).toBeHidden();
  87  |   });
  88  | }
  89  | 
  90  | test('TEST-UI-02: invalid search announces its reason and associates the message only while invalid', async ({ page }) => {
  91  |   await page.goto('/');
  92  |   await expect(cards(page)).toHaveCount(10);
  93  |   const search = page.getByRole('textbox', { name: 'Search games' });
  94  |   const validation = page.locator('#search-validation');
  95  |   // A mounted, initially empty live region can announce its subsequent text update.
  96  |   expect.soft(await search.getAttribute('aria-describedby')).toBeNull();
  97  |   expect.soft(await validation.getAttribute('aria-live')).toBe('polite');
  98  |   expect.soft(await validation.getAttribute('hidden')).toBeNull();
  99  |   expect.soft(await validation.textContent()).toBe('');
  100 | 
  101 |   await search.fill('x'.repeat(81));
  102 |   await expect(search).toHaveAttribute('aria-invalid', 'true');
  103 |   await expect(search).toHaveAttribute('aria-describedby', 'search-validation');
  104 |   await expect(validation).toBeVisible();
  105 |   await expect(validation).toHaveText('Search must be 80 characters or fewer');
  106 |   await expect(cards(page)).toHaveCount(10);
  107 | 
  108 |   await search.fill('x'.repeat(80));
  109 |   await expect(page.getByRole('status')).toContainText('No games found');
  110 |   await expect(search).not.toHaveAttribute('aria-invalid', 'true');
  111 |   expect.soft(await search.getAttribute('aria-describedby')).toBeNull();
  112 |   expect.soft(await validation.textContent()).toBe('');
  113 | 
  114 |   await search.fill('x'.repeat(81));
  115 |   await expect(validation).toHaveText('Search must be 80 characters or fewer');
  116 |   await expect(search).toHaveAttribute('aria-describedby', 'search-validation');
  117 |   await page.getByRole('button', { name: 'Clear controls' }).click();
  118 |   await expect(cards(page)).toHaveCount(10);
  119 |   await expect(search).not.toHaveAttribute('aria-invalid', 'true');
```