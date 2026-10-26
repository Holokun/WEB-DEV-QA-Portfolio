# Task 2 review — favourites model and views

## Spec Compliance

- ❌ Issues found: internal Library navigation discards the shared in-memory favourites after a storage failure. `app/ui/index.html:12` supplies a normal `href="/"` link; unlike the detail Back flow, it has no handler to change the hash without replacing the document. This contradicts the shared-store/navigation usability requirement and the warning's promise that changes remain available for this visit.
- All requested implementation files and the two narrowly authorized test adjustments are present. The API change only adds UI asset entries (`app/api/application.ts:12`).
- ⚠️ Broader branch integration and the final full regression remain controller checks. This task review does not independently establish screen-reader, axe, CI, or cross-browser completion.

## Strengths

- `app/ui/favourites.ts:34`, `app/ui/favourites.ts:54`: normalization removes invalid/duplicate IDs while obsolete-ID cleanup is a separate operation; read failure disables writes rather than overwriting storage that could not be read.
- `app/ui/catalogue.ts:70`: validation belongs to the latest successful unfiltered catalogue response. It preserves current request ownership and adds no separate validation request.
- `app/ui/favourite-button.ts:4`, `app/ui/favourite-button.ts:11`: title-specific accessible names, membership-based pressed state, literal text rendering, and no per-button model subscriptions.
- `app/ui/catalogue.ts:111`, `app/ui/favourites-view.ts:93`: view destruction invalidates request ownership, aborts listeners/requests, and removes the model subscription.
- `tests/e2e/favourites.spec.ts:62`, `tests/e2e/favourites.spec.ts:107`, `tests/e2e/favourites.spec.ts:193`: meaningful coverage includes isolated catalogue mutation, failed/filtered request retention, Retry cleanup, and neighbouring focus after removal.
- `tests/e2e/catalogue.spec.ts:376`: the direct cleanup probe is adapted to the required store and adds a real subscription-cleanup assertion while retaining its request/listener/destroy checks.

## Issues

### Critical (Must Fix)

None found.

### Important (Should Fix)

**I1 — Library header navigation loses favourites during the same visit when persistence fails.**

- **Location:** `app/ui/index.html:12`; shared store creation at `app/ui/main.ts:7`.
- **Reproduction:** block `Storage.prototype.setItem`, open the catalogue, add Orbit, open Favourites, and click header Library.
- **Observed:** the saved list initially contains Orbit and the header reads `Favourites (1)`. Clicking Library issues another root document request, replaces the window/document, recreates the store from unchanged storage, and displays `Favourites (0)` / `Add Orbit to favourites`.
- **Impact:** normal navigation discards the memory fallback promised by the persistence warning. Users cannot keep a saved selection while moving back to the catalogue after a denied/full storage write. Existing storage-failure coverage (`tests/e2e/favourites.spec.ts:135`) only navigates from catalogue to Favourites and removes there; it does not exercise returning through Library.
- **Fix:** keep the required Library URL and intercept ordinary unmodified primary clicks to clear the hash through the current router, preserving normal modified-click behavior. Add a focused failing regression that returns through Library after a failed write and proves count/button/list membership survive. This is different from explicit reload, where restoring the last successfully persisted selection is correct.
- **Evidence path:** `test-results/sdd/favourites-feedback-2026-10-12/task-2-review.md`, “Focused experiment I1” below.

### Minor (Nice to Have)

None found.

## Assessment

**Task quality:** Needs fixes.

**Reasoning:** The model and mounted views satisfy the requested boundaries and have meaningful focused evidence. One confirmed navigation defect breaks the required memory fallback across an ordinary internal route change, so the task should be fixed and receive a scoped re-review before its commit.

## Evidence reviewed and review scope

Read the binding task brief, implementer report, and packaged diff. The first tool response truncated the middle of the package; only that omitted portion was retrieved in chunks. No changed source files were separately reread, no git diff was regenerated, and no source/index/branch state was changed.

Read existing logs rather than rerunning suites: RED shows 14 expected feature failures; the final favourites run shows 16 passes; final build succeeds; the changed-path run has 70 passes and one direct-mount interface failure; the subsequent cleanup-probe run passes after the required-store adaptation. Final successful logs contain no warning noise. The resolved intermediate failure is not an outstanding finding.

One named risk prompted one focused experiment: **whether header Library navigation replaces the document and therefore loses the shared store under failed persistence**. Inspected the unchanged app fixture only to identify the existing application's launch contract. Ran the built application with an in-memory SQLite database and one Chromium page; no human/development database was used and no existing suite was run. Initial sandbox launches could not use pnpm's workspace realpath / the real installed browser path; scoped elevated direct Node execution then completed the same experiment successfully. Those execution restrictions are not product failures.

## Focused experiment I1

Exact successful PowerShell command, run from `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio` (direct Node, with scoped elevated execution):

```powershell
@'
import { chromium } from '@playwright/test';
import { createApplication } from './dist/app/api/application.js';
import { resolve } from 'node:path';
const app = createApplication({ dbPath: ':memory:', uiDir: resolve('dist/app/ui') });
let browser;
try {
  await new Promise(resolveReady => app.server.listen(0, '127.0.0.1', resolveReady));
  const baseURL = `http://127.0.0.1:${app.server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const documents = [];
  page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url()); });
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Add Orbit to favourites', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'Main' });
  await nav.getByRole('link', { name: /^Favourites/ }).click();
  await page.getByRole('list', { name: 'Favourite games' }).getByRole('link', { name: 'Orbit', exact: true }).waitFor();
  await page.evaluate(() => { window.reviewDocumentMarker = 'original'; });
  const before = { count: await nav.getByRole('link', { name: /^Favourites/ }).innerText(), url: page.url() };
  await nav.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: /^(Add|Remove) Orbit (to|from) favourites$/, exact: true }).waitFor();
  const after = { count: await nav.getByRole('link', { name: /^Favourites/ }).innerText(), url: page.url(), marker: await page.evaluate(() => window.reviewDocumentMarker ?? null), button: await page.getByRole('button', { name: /^(Add|Remove) Orbit (to|from) favourites$/, exact: true }).getAttribute('aria-label') };
  console.log(JSON.stringify({ risk: 'Library header navigation resets memory-only favourites', before, after, documents }, null, 2));
} finally {
  if (browser) await browser.close();
  await app.close();
}
'@ | & 'C:/Users/Betelgoida/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' --input-type=module -
```

Successful command exit code: `0`. Actual stdout:

```json
{
  "risk": "Library header navigation resets memory-only favourites",
  "before": {
    "count": "Favourites (1)",
    "url": "http://127.0.0.1:63891/#/favourites"
  },
  "after": {
    "count": "Favourites (0)",
    "url": "http://127.0.0.1:63891/",
    "marker": null,
    "button": "Add Orbit to favourites"
  },
  "documents": [
    "http://127.0.0.1:63891/",
    "http://127.0.0.1:63891/"
  ]
}
```

