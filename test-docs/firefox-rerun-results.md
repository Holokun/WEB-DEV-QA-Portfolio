# Firefox desktop rerun results

Historical run: a subsequent [launch repair and two-test verification](firefox-launch-repair.md) resolved launch. The [full post-repair Firefox rerun on 2026-10-06](firefox-regression-results-2026-10-06.md) passed all 66 existing checks. The failed 66-check execution below remains unchanged.

Executed on **2026-10-05** after the user reported installing Firefox. The required Firefox desktop gate remains **blocked**: all 66 checks were attempted, and every check failed during browser launch before page creation. No Firefox application behavior was verified by this rerun.

This is a new Firefox-only execution report. The earlier complete-suite result in [first-slice-results.md](first-slice-results.md)—206 passed and 66 Firefox launch failures across 272 project executions—is historical evidence. API, Chromium, WebKit and phone projects were not rerun here; this execution does not establish a newly passing complete suite or close the portfolio release gate.

## Commands and actual results

Working directory: `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio`. Branch: `main`. Commit: `b3b0dc4e12e3aa5a2e6bcafd8d88065ae9b435bd`. The existing local README modification and untracked `AGENTS.md` were preserved. Product code, tests, expected results and Playwright configuration were not changed for this rerun.

| Command | Started / finished (Asia/Yerevan, UTC+04:00) | Result |
| --- | --- | --- |
| `pnpm build` | 2026-10-05 19:10:52.406 / 19:10:53.070 | Exit 0; TypeScript compilation and static asset copy completed. |
| `pnpm exec playwright test --project=firefox` | 2026-10-05 19:11:49.698 / 19:12:17.777 | Exit 1; 66 attempted, 0 passed, 66 failed, 0 skipped. Command wall-clock interval approximately 28.1 seconds. |

| Firefox desktop checks | Attempted | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: | ---: |
| Catalogue (`tests/e2e/catalogue.spec.ts`) | 38 | 0 | 38 | 0 |
| Detail and patch notes (`tests/e2e/detail.spec.ts`) | 23 | 0 | 23 | 0 |
| Layout and keyboard (`tests/e2e/layout.spec.ts`) | 5 | 0 | 5 | 0 |
| **Total** | **66** | **0** | **66** | **0** |

The unchanged project uses one worker, a 1280 × 800 desktop viewport, and the `firefox` browser engine. The exact command selected every case in the project without a grep filter, skips or an alternate browser. A saved-log count found 66 occurrences of the same launch error; `test-results/artifacts/.last-run.json` also recorded `status: failed` and 66 failed test IDs. These are browser setup failures, not 66 observed application defects.

## Environment and selected browser

Windows build `10.0.26200.0`, x64; PowerShell 7.6.5; Node.js v24.19.0; pnpm 11.19.0. The repository pins Playwright 1.63.0 and TypeScript 7.0.2.

The successful runner-resolution probe and all test launch logs selected the existing executable:

```text
C:\Users\Betelgoida\AppData\Local\ms-playwright\firefox-1543\firefox\firefox.exe
```

Installed Playwright package metadata identifies Firefox revision `1543`, browser version `155.0`. That metadata is not proof that Firefox launched successfully.

The current user's Windows App Paths registration identifies the separately installed Mozilla Firefox Microsoft Store package:

```text
C:\Program Files\WindowsApps\Mozilla.Firefox_157.0.0.0_x64__n80bbvh6b1yt2\VFS\ProgramFiles\Firefox Package Root\firefox.exe
```

Read-only executable metadata reports product version `157.0`. This is a different executable from the one selected by the unchanged Playwright configuration. The ordinary Firefox installation therefore did not change the browser used for this run.

A preliminary restricted-runner probe failed with a repository `realpath` permission error and resolved a sandbox-specific cache path. It did not execute these tests. The build and complete Firefox rerun above ran with scoped permission outside that restriction, using the existing dependencies. No dependency or browser installation was performed.

## Launch blocker and diagnosis

Every case reported:

```text
Error: browserType.launch: spawn UNKNOWN
```

The launch call used the pinned executable with `-no-remote -headless -profile ... -juggler-pipe -silent`. No browser page or UI assertion was reached.

Read-only Windows Application log inspection found fresh **SideBySide event 33** entries during this run, including 2026-10-05 19:12:16 and 19:12:17 UTC+04:00. They identify the same pinned executable and state that activation context generation failed because dependent assembly `mozglue`, type `win32`, version `1.0.0.0`, could not be found. This confirms that the previously recorded activation-context blocker is still present for the selected binary. It does not establish file corruption or security-policy causation.

The authorized scope was a rerun and factual reporting. No browser reinstall, security-setting change, native system tracing, third-party binary modification or replacement browser configuration was performed.

## Local evidence and current gate

Complete command output and timestamps are retained under the ignored directory `.superpowers/sdd/2026-10-05-catalogue-first-slice/`:

- `firefox-rerun-build-2026-10-05.log` — full successful build output and exit code.
- `firefox-rerun-2026-10-05.log` — complete 66-case output, every launch stack and final exit code.
- `firefox-rerun-environment-verified-2026-10-05.log` — selected executable, pinned metadata, ordinary Firefox metadata and launch-time Windows event entries.

The generated HTML report is at `playwright-report/index.html`; per-case error contexts and Playwright traces are under `test-results/artifacts/`. These report/artifact locations are shared and can be overwritten by later invocations. The retained rerun logs are local ignored evidence and are not supplied merely by cloning the repository.

Required Firefox coverage remains unverified for the first-slice catalogue, detail, patch notes, layout and keyboard behavior. No check is waived or counted as passed. Existing `REQ-`, `SCN-` and `TEST-` identifiers remain unchanged. The full test-plan and release gates remain open.
