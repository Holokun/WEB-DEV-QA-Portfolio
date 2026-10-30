# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/favourites.spec.ts >> TEST-UI-08: invalid/duplicate IDs normalize; failed/filtered requests retain candidates until complete success
- Location: tests/e2e/favourites.spec.ts:64:1

# Error details

```
Error: Owned app failed to stop
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]: Game Companion
    - navigation "Main" [ref=e4]:
      - link "Library" [ref=e5] [cursor=pointer]:
        - /url: /
      - link "Favourites (1)" [ref=e6] [cursor=pointer]:
        - /url: /#/favourites
      - link "Feedback" [ref=e7] [cursor=pointer]:
        - /url: /#/feedback
  - main [ref=e8]:
    - generic [ref=e9]:
      - paragraph [ref=e10]: THE LIBRARY
      - heading "Find your next world." [level=1] [ref=e11]
      - paragraph [ref=e12]: Explore the collection by title or genre.
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Search games
          - textbox "Search games" [active] [ref=e16]:
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
      - status [ref=e21]: 9 games
      - paragraph [ref=e22]: Results for search “All titles”; genre “All genres” · 9 games
      - list "Games" [ref=e23]:
        - listitem [ref=e24]:
          - link "Atlas Tactics" [ref=e25] [cursor=pointer]:
            - /url: /#/games/10
          - paragraph [ref=e26]: Strategy
          - button "Remove Atlas Tactics from favourites" [pressed] [ref=e27] [cursor=pointer]
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
          - link "ORBIT" [ref=e49] [cursor=pointer]:
            - /url: /#/games/2
          - paragraph [ref=e50]: RPG
          - button "Add ORBIT to favourites" [ref=e51] [cursor=pointer]
        - listitem [ref=e52]:
          - link "Zeta" [ref=e53] [cursor=pointer]:
            - /url: /#/games/4
          - paragraph [ref=e54]: Strategy
          - button "Add Zeta to favourites" [ref=e55] [cursor=pointer]
        - listitem [ref=e56]:
          - link "Écho" [ref=e57] [cursor=pointer]:
            - /url: /#/games/3
          - paragraph [ref=e58]: Puzzle
          - button "Add Écho to favourites" [ref=e59] [cursor=pointer]
  - contentinfo [ref=e60]: Ten fictional worlds. A local catalogue for exploring and testing.
```

# Test source

```ts
  1  | import { test as base } from '@playwright/test';
  2  | import { spawn, type ChildProcess } from 'node:child_process';
  3  | import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
  4  | import { resolve, join } from 'node:path';
  5  | 
  6  | export function ownedDatabase(): string {
  7  |   const root = resolve('test-results/owned-databases');
  8  |   mkdirSync(root, { recursive: true });
  9  |   const directory = mkdtempSync(join(root, 'run-'));
  10 |   writeFileSync(join(directory, '.game-companion-test-owner'), 'game-companion-test-database-v1\n');
  11 |   return join(directory, 'games.sqlite');
  12 | }
  13 | 
  14 | export async function startApp(dbPath: string, uiDir?: string): Promise<{ baseURL: string; stop(): Promise<void> }> {
  15 |   const child = spawn(process.execPath, ['dist/app/api/server.js'], {
  16 |     env: { ...process.env, PORT: '0', DB_PATH: dbPath, ...(uiDir ? { UI_DIR: uiDir } : {}) },
  17 |     stdio: ['ignore', 'pipe', 'pipe'],
  18 |   });
  19 |   let stderr = '';
  20 |   child.stderr!.on('data', chunk => { stderr += chunk.toString(); });
  21 |   try {
  22 |     const baseURL = await new Promise<string>((resolveURL, reject) => {
  23 |       let stdout = '';
  24 |       const timeout = setTimeout(() => reject(new Error(`App readiness timeout: ${stderr}`)), 15_000);
  25 |       child.once('error', error => { clearTimeout(timeout); reject(error); });
  26 |       child.once('exit', code => { clearTimeout(timeout); reject(new Error(`App exited ${code}: ${stderr}`)); });
  27 |       child.stdout!.on('data', chunk => {
  28 |         stdout += chunk.toString();
  29 |         const line = stdout.split('\n').find(candidate => candidate.startsWith('{'));
  30 |         if (line) {
  31 |           try { const ready = JSON.parse(line) as { url: string }; clearTimeout(timeout); resolveURL(ready.url); }
  32 |           catch (error) { clearTimeout(timeout); reject(error); }
  33 |         }
  34 |       });
  35 |     });
  36 |     return { baseURL, stop: () => stopProcess(child) };
  37 |   } catch (error) { await stopProcess(child); throw error; }
  38 | }
  39 | 
  40 | async function stopProcess(child: ChildProcess): Promise<void> {
  41 |   if (child.exitCode !== null || child.signalCode !== null) return;
  42 |   await new Promise<void>((resolveExit, reject) => {
> 43 |     const timeout = setTimeout(() => reject(new Error('Owned app failed to stop')), 10_000);
     |                                             ^ Error: Owned app failed to stop
  44 |     child.once('exit', () => { clearTimeout(timeout); resolveExit(); });
  45 |     child.kill();
  46 |   });
  47 | }
  48 | 
  49 | export const test = base.extend<{ dbPath: string }, { ownedApp: { baseURL: string; dbPath: string } }>({
  50 |   ownedApp: [async ({}, use) => {
  51 |     const baseURL = process.env.GAME_TEST_URL;
  52 |     const dbPath = process.env.GAME_TEST_DB;
  53 |     if (!baseURL || !dbPath) throw new Error('Suite-owned app is not ready');
  54 |     await use({ baseURL, dbPath });
  55 |   }, { scope: 'worker' }],
  56 |   baseURL: async ({ ownedApp }, use) => { await use(ownedApp.baseURL); },
  57 |   dbPath: async ({ ownedApp }, use) => { await use(ownedApp.dbPath); },
  58 | });
  59 | export { expect } from '@playwright/test';
  60 | 
```