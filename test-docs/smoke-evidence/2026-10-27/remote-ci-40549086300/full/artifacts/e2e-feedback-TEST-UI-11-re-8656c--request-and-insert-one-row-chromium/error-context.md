# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/feedback.spec.ts >> TEST-UI-11: repeated submit events while pending send one real request and insert one row
- Location: tests/e2e/feedback.spec.ts:138:1

# Error details

```
Error: Owned app failed to stop
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]: Game Companion
    - navigation "Main" [ref=e4]:
      - link "Library" [ref=e5] [cursor=pointer]:
        - /url: /
      - link "Favourites (0)" [ref=e6] [cursor=pointer]:
        - /url: /#/favourites
      - link "Feedback" [ref=e7] [cursor=pointer]:
        - /url: /#/feedback
  - main [ref=e8]:
    - generic [ref=e9]:
      - link "Back" [ref=e10] [cursor=pointer]:
        - /url: /
      - paragraph [ref=e11]: SHARE YOUR EXPERIENCE
      - heading "Feedback" [level=1] [ref=e12]
      - paragraph [ref=e13]: Choose a game and tell us about your experience.
      - status [ref=e14]: Feedback submitted. Thank you!
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Game
          - combobox "Game" [ref=e18]:
            - option "Choose a game"
            - option "Atlas Tactics"
            - option "Ember Quest"
            - option "Ember Trail"
            - option "Iron Citadel"
            - option "Moss Garden"
            - option "Neon Sprint"
            - option "Orbit" [selected]
            - option "ORBIT"
            - option "Zeta"
            - option "Écho"
          - paragraph
        - generic [ref=e19]:
          - generic [ref=e20]: Email
          - textbox "Email" [ref=e21]: player@example.com
          - paragraph
        - generic [ref=e22]:
          - generic [ref=e23]: Description
          - textbox "Description" [ref=e24]: Single pending submission 628d6b18-800f-4b47-8c5c-965d2275c295
          - paragraph [ref=e25]: At least 20 characters after trimming spaces.
          - paragraph
        - button "Submit feedback" [ref=e26] [cursor=pointer]
  - contentinfo [ref=e27]: Ten fictional worlds. A local catalogue for exploring and testing.
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