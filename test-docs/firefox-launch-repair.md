# Firefox launch repair — two-test verification

Historical repair verification: the subsequent [full Firefox rerun on 2026-10-06](firefox-regression-results-2026-10-06.md) passed all 66 existing checks, without skips or retries. The two-test repair record below remains unchanged.

Executed on **2026-10-05**, Windows 11 build 26200, x64, Node.js 24.19.0, pnpm 11.19.0 and Playwright 1.63.0. The Firefox launch blocker is resolved for the verified scope: **2 passed, 0 failed, 0 skipped**, using the project's saved configuration without a temporary browser-cache override. The other **64 Firefox checks were not rerun**. This does not establish a passing complete suite or close the portfolio release gate.

The earlier [66-check Firefox report](firefox-rerun-results.md) and [complete-suite report](first-slice-results.md) remain historical execution records. No `REQ-`, `SCN-` or `TEST-` identifier, test expectation, or product behavior was changed.

## Diagnosis and repair

The original executable in `C:\Users\Betelgoida\AppData\Local\ms-playwright\firefox-1543\firefox` fails before page creation with `browserType.launch: spawn UNKNOWN`. Windows reports SideBySide event 33: activation context generation cannot resolve the private `mozglue` assembly. Installing ordinary Firefox did not affect this separate Playwright browser.

An official reinstall with `pnpm exec playwright install --force --no-remove firefox` succeeded but did not resolve launch: the same first two tests still failed. SHA-256 hashes of `firefox.exe`, `mozglue.dll` and `xul.dll` were unchanged by the reinstall.

Windows activation-context probes then compared copies with the installed files. The unchanged copies in the repository loaded successfully; the installed user-cache executable returned Windows error `14001`. A hypothesis about manifest resource numbering was rejected: both the unchanged copy and a diagnostic-only copy with an added resource loaded successfully. That modified diagnostic copy was never used as the runtime browser. The exact Windows reason for the location-dependent failure remains undetermined; corruption, permission, and security-policy causes are not asserted.

The same official Firefox **155.0, revision 1543** was installed under the ignored `.playwright-browsers` directory inside the repository. Both selected tests passed there. Comparison of **all 59 corresponding browser files** found identical SHA-256 hashes and no missing or additional files. The runtime uses an unmodified official browser; no Windows security settings or system tracing sessions were changed for this repair.

The saved repair consists of:

- `pnpm browsers:install`: installs the three required engines through the pinned Playwright CLI. On Windows, Firefox uses the project cache; Chromium and WebKit keep their normal cache. `pnpm browsers:install firefox` installs Firefox alone. The installer preserves other browser versions with `--no-remove`.
- `playwright.config.ts`: selects the project-cache Firefox executable on Windows, deriving its revision directory from the installed Playwright metadata rather than pinning a second browser version. Other operating systems and explicit `PLAYWRIGHT_BROWSERS_PATH` overrides retain normal behavior.
- `.gitignore`: excludes downloaded browser files. A fresh checkout needs `pnpm install --frozen-lockfile` followed by `pnpm browsers:install`.

Playwright documents the supported cache override in [Browsers](https://playwright.dev/docs/browsers#managing-browser-binaries). Tests retain the Firefox engine and 1280 × 800 viewport.

## Final verification

The test list confirmed **exactly two selected tests**. Final verification used no `PLAYWRIGHT_BROWSERS_PATH` override:

```powershell
pnpm browsers:install firefox
pnpm build
pnpm exec playwright test tests/e2e/catalogue.spec.ts:12 tests/e2e/catalogue.spec.ts:22 --project=firefox --add-reporter=json
```

`PLAYWRIGHT_JSON_OUTPUT_FILE` only designated the evidence file; it did not change browser selection. Browser installation and build both exited 0. The final test command ran from **23:41:20.306 to 23:41:23.899 Asia/Yerevan (UTC+04:00)** and exited **0**. Playwright reported **2 passed in 2.7 seconds**, one worker, no retries, no skips, and no flaky results.

| Selected automated test | Result | Verified behavior |
| --- | --- | --- |
| `TEST-UI-01 catalogue: seeded cards have ordered titles, genres and real game links` | Passed | Ten fixture titles in order, genres, game link, default filter and genre options. |
| `TEST-UI-02/03 catalogue: search and genre intersect and clearing either preserves the other` | Passed | Search, combined genre filtering, and independent clearing of each control. |

Only these two distinct tests were executed during the repair: they failed after user-cache reinstall, passed with a temporary project-cache override, then passed again with the saved configuration. No full 66-test run or other browser/API project was executed. These results verify selected portions of three inventory IDs, not completion of every variant within those entries.

## Durable evidence

- [Final command output and timestamps](firefox-repair-evidence/first-two.log).
- [Original Playwright JSON results](firefox-repair-evidence/first-two-results.json).
- [Successful build output](firefox-repair-evidence/build.log).
- [Browser file comparison](firefox-repair-evidence/browser-file-verification.json).
- [Catalogue screenshot from the first Firefox test](firefox-repair-evidence/catalogue.png).

The JSON reporter's original attachment paths point into the shared `test-results/artifacts` directory. The screenshot above is a preserved copy, so subsequent runs can clear shared artifacts without removing this evidence. Detailed diagnostic and installation logs remain in the ignored `.superpowers/sdd/2026-10-05-catalogue-first-slice` directory.

Full Firefox catalogue/detail/patch-note/layout/keyboard coverage, other-browser verification after this configuration change, and full-version acceptance remain open. The TestRail transfer is an earlier documentation snapshot; this follow-up was recorded locally and no TestRail execution results were published.
