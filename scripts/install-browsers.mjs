import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const projectRoot = join(import.meta.dirname, '..');
const requested = process.argv.slice(2);
const browsers = requested.length ? requested : ['chromium', 'firefox', 'webkit'];
if (browsers.some(browser => !['chromium', 'firefox', 'webkit'].includes(browser))) {
  console.error('Use browsers:install with chromium, firefox, webkit, or no arguments for all three.');
  process.exit(1);
}

function install(names, env = process.env) {
  if (!names.length) return;
  const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'install', '--no-remove', ...names], {
    cwd: projectRoot, env, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Browser installation failed${result.signal ? ` (${result.signal})` : ''}.`);
    process.exit(result.status ?? 1);
  }
}

if (process.platform === 'win32' && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
  install(browsers.filter(browser => browser !== 'firefox'));
  if (browsers.includes('firefox')) {
    install(['firefox'], { ...process.env, PLAYWRIGHT_BROWSERS_PATH: join(projectRoot, '.playwright-browsers') });
  }
} else {
  install(browsers);
}
