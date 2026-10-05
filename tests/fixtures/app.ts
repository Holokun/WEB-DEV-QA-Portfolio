import { test as base } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { resetTestDatabase } from '../../app/db/reset.js';

export function ownedDatabase(): string {
  const root = resolve('test-results/owned-databases');
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(join(root, 'run-'));
  writeFileSync(join(directory, '.game-companion-test-owner'), 'game-companion-test-database-v1\n');
  return join(directory, 'games.sqlite');
}

export async function startApp(dbPath: string, uiDir?: string): Promise<{ baseURL: string; stop(): Promise<void> }> {
  const child = spawn(process.execPath, ['dist/app/api/server.js'], {
    env: { ...process.env, PORT: '0', DB_PATH: dbPath, ...(uiDir ? { UI_DIR: uiDir } : {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr!.on('data', chunk => { stderr += chunk.toString(); });
  try {
    const baseURL = await new Promise<string>((resolveURL, reject) => {
      let stdout = '';
      const timeout = setTimeout(() => reject(new Error(`App readiness timeout: ${stderr}`)), 15_000);
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`App exited ${code}: ${stderr}`)); });
      child.stdout!.on('data', chunk => {
        stdout += chunk.toString();
        const line = stdout.split('\n').find(candidate => candidate.startsWith('{'));
        if (line) {
          try { const ready = JSON.parse(line) as { url: string }; clearTimeout(timeout); resolveURL(ready.url); }
          catch (error) { clearTimeout(timeout); reject(error); }
        }
      });
    });
    return { baseURL, stop: () => stopProcess(child) };
  } catch (error) { await stopProcess(child); throw error; }
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolveExit, reject) => {
    const timeout = setTimeout(() => reject(new Error('Owned app failed to stop')), 10_000);
    child.once('exit', () => { clearTimeout(timeout); resolveExit(); });
    child.kill();
  });
}

export const test = base.extend<{ dbPath: string }, { ownedApp: { baseURL: string; dbPath: string } }>({
  ownedApp: [async ({}, use) => {
    const dbPath = ownedDatabase();
    resetTestDatabase(dbPath);
    const app = await startApp(dbPath);
    try { await use({ ...app, dbPath }); } finally { await app.stop(); }
  }, { scope: 'worker' }],
  baseURL: async ({ ownedApp }, use) => { await use(ownedApp.baseURL); },
  dbPath: async ({ ownedApp }, use) => { await use(ownedApp.dbPath); },
});
export { expect } from '@playwright/test';
