# Firefox desktop regression — 2026-10-06

**66 passed, 0 failed, 0 skipped, 0 flaky; exit 0.** Every existing Firefox test was selected and executed once, without retries or filtering. Playwright reported **41.3 seconds**. The launch blocker observed on 2026-10-05 did not recur with the saved project-cache configuration.

| Area | Executed | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: | ---: |
| Catalogue, search and filtering | 38 | 38 | 0 | 0 |
| Game details and patch notes | 23 | 23 | 0 | 0 |
| Desktop layout and keyboard | 5 | 5 | 0 | 0 |
| **Total** | **66** | **66** | **0** | **0** |

The [interactive HTML report](firefox-regression-2026-10-06-evidence/html/index.html) contains every case. The [66-row case register](firefox-regression-2026-10-06-evidence/case-results.csv) preserves each exact title, source location, native result ID, status and duration. Existing `REQ-`, `SCN-` and `TEST-` identifiers were retained.

## Execution and environment

```powershell
pnpm build
pnpm exec playwright test --project=firefox --add-reporter=json
```

The collection command `pnpm exec playwright test --project=firefox --list --reporter=json` selected 66 checks in three files. The executed result IDs were independently compared with that collection: all 66 matched, with no omissions or duplicates. All cases had expected status `passed`, an actual `passed` result, and retry count 0. Runner-level errors were empty. The native HTML report's embedded result totals also matched the original JSON output.

| Command | Start / finish, Asia/Yerevan (UTC+04:00) | Result |
| --- | --- | --- |
| `pnpm build` | 09:37:21.993 / 09:37:25.934 | Exit 0; TypeScript compilation and asset copy completed. |
| Firefox test command | 09:38:59.187 / 09:39:41.563 | Exit 0; 66 passed. Native test duration 41.329 seconds; command interval approximately 42.376 seconds. |

Windows `10.0.26200.0`, x64; PowerShell 7.6.5; Node.js 24.19.0; pnpm 11.19.0; pinned Playwright 1.63.0 and Firefox 155.0, revision 1543. One worker, fresh browser contexts, headless Firefox, desktop viewport **1280 × 800**. No `PLAYWRIGHT_BROWSERS_PATH` override was supplied. The actual launch log selected:

```text
D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\.playwright-browsers\firefox-1543\firefox\firefox.exe
```

The browser started successfully and later exited 0. The source was the working tree on `main`, based on commit `b3b0dc4e12e3aa5a2e6bcafd8d88065ae9b435bd`, including the uncommitted Firefox cache repair. SHA-256 fingerprints of 27 application, test, installer and configuration files were recorded before execution and verified unchanged afterward. No product code, test expectations, dependency versions or browser binaries were modified for this run.

`DEBUG=pw:browser` preserved browser diagnostics. `PLAYWRIGHT_JSON_OUTPUT_FILE` and `PLAYWRIGHT_HTML_OUTPUT_DIR` designated the dated evidence directory; they did not change test selection. HTML auto-opening was disabled. Suite setup used its owned isolated SQLite database and available local port; teardown stopped the owned app. Development data was not reset.

## Verified scope

The executed catalogue cases cover fixture order and links, literal ASCII-only search, search/genre intersections and clearing, trimmed 80/81 ASCII and emoji boundaries, loading/empty/error states, current-control Retry, retained successful content and stale-response ownership. The detail cases cover matching content, direct entry/reload/history, note ordering and empty notes, separate loading/error recovery, 404 behavior, old responses after navigation, and literal fixture text. Layout and keyboard cases exercise desktop overflow, long fixture content, visible focus, navigation and Retry.

HTTP 500 responses, network aborts and delayed responses in these cases are controlled test conditions. Their successful handling is not a count of spontaneous production defects. The persisted lifecycle test dispatches `pagehide`/`pageshow`; it does not establish native BFCache eligibility.

Catalogue and detail/notes screenshots were preserved and visually inspected. Text and controls were readable, with no visible overlap or clipping in these captured desktop states. This limited observation does not replace manual exploratory testing, screen-reader review or axe checks.

## Diagnostic observations

The assertion result is green; the diagnostic log is not empty. These observations remain available for investigation:

- **OBS-FF-01 — lifecycle interruption warnings.** The browser log contains 66 `Script terminated by timeout` messages pointing to `catalogue.js` or `detail.js`, with `destroy()` and the `main.js` `pagehide` handler in the stack. They appear around document teardown during the run. The suite has no assertion that console/page errors are absent. No failing assertion or independently reproduced user-visible defect was established here; the exact cause remains untriaged.
- **OBS-FF-02 — Firefox internal diagnostics.** The log also contains Juggler progress-listener errors, taskbar/remote-settings messages and a graphics compositor warning from browser-internal URLs. The browser completed the run and the captured pages rendered. Their presence is recorded without treating them as proven application defects.

See the [complete execution log](firefox-regression-2026-10-06-evidence/execution.log), including these messages. Passing checks do not establish a clean console or the absence of all defects.

## Evidence and current status

- [Original Playwright JSON](firefox-regression-2026-10-06-evidence/results.json).
- [Verified totals and collection/source comparisons](firefox-regression-2026-10-06-evidence/verification-summary.json).
- [Build log](firefox-regression-2026-10-06-evidence/build.log), [environment](firefox-regression-2026-10-06-evidence/environment.json), [browser configuration](firefox-regression-2026-10-06-evidence/browser-configuration.json) and [source fingerprints](firefox-regression-2026-10-06-evidence/source-fingerprint.json).
- [Catalogue screenshot](firefox-regression-2026-10-06-evidence/screenshots/catalogue-view.png) and [detail/notes screenshot](firefox-regression-2026-10-06-evidence/screenshots/detail-view.png).

The HTML report, JSON, logs and screenshots are retained in a dated directory outside Playwright's shared artifact cleanup target. The raw JSON's attachment paths, where present, remain its original paths; the preserved screenshots above are separate durable copies.

All **existing first-slice Firefox automated checks** now have passing execution evidence. This supersedes the Firefox launch failures in the [2026-10-05 rerun](firefox-rerun-results.md) and extends the [two-test repair verification](firefox-launch-repair.md). Their original results remain historical records.

API, Chromium, WebKit and phone projects were not rerun. The earlier complete-suite result must not be recomputed as a new 272/272 passing execution by adding this run to older results. Favourites, feedback, remaining full-version inventory variants, axe, manual/exploratory QA, CI and portfolio release criteria remain open. No manual scenarios or TestRail cases were marked passed, and no execution results were published to TestRail.
