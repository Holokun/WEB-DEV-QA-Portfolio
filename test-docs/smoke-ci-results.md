# Five-path smoke and CI configuration — 2026-10-27

Later execution update: after publication, [hosted CI](github-actions-results.md) passed smoke15/15 and full583/583 at `09fb1e0`, without failures/skips/retries. The preparation and initial local failure below remain historical; no earlier screenshot root cause or fix is inferred from the later pass.

Status: **implementation prepared for independent review; first local smoke run has a retained failure. GitHub Actions has not been published or executed.** The complete smoke invocation passed 14 of 15 tests. A separate unchanged Chromium catalogue check passed 1 of 1. These are separate results; they do not establish a passing 15-test invocation or close the portfolio release gate.

## Delivered scope

Five existing primary successful tests now carry `@smoke`. Only their titles changed; a local comparison against committed `94779ebd20c08e763ec0c99cae4aa0dbb4238af7` removed the added tags and confirmed all four test files otherwise match, after normalizing line endings. Assertions, screenshots, SQL verification, fixtures and test data remain intact.

| Smoke entry | Existing path selected | Desktop executions |
| --- | --- | --- |
| TEST-UI-01 | Seeded titles, genres, order and real links | Chromium, Firefox, WebKit |
| TEST-UI-02 | Search/genre intersection and independent clearing (existing TEST-UI-02/03 case) | Chromium, Firefox, WebKit |
| TEST-UI-06 | Orbit card → matching detail → ordered notes → Back | Chromium, Firefox, WebKit |
| TEST-UI-07 | Add/remove across cards/detail/saved list, count and reload persistence (existing TEST-UI-07/08 case) | Chromium, Firefox, WebKit |
| TEST-UI-11 | Real accepted feedback → confirmation → Back; SQL checks retained | Chromium, Firefox, WebKit |

The feedback helper requires a real POST `201`, a safe positive returned ID, exactly one more row, and that returned ID's exact game/email/description fields after trimming. Read-only post-run inspection corroborated three rows, one from each browser. It does not replace the per-submission assertions. Validation, failure, recovery and empty-state variants remain in full regression. Smoke does not select API, accessibility or phone projects. This is five primary paths and 15 browser executions, not five inventory entries completed in all their variants.

`pnpm test:smoke` builds first and selects the three desktop projects with `--grep @smoke --workers=1 --retries=0 --forbid-only`. No tests were copied, skipped or weakened. The existing owned fixture creates one absolute dedicated test DB, resets only it, starts one app on an available port and awaits teardown. No user/development database was reset.

## Local execution and investigation

Tester: Codex task-2 implementation worker. Root: `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio`, branch `main`, base commit `94779ebd20c08e763ec0c99cae4aa0dbb4238af7` plus the smoke title/script/workflow changes. Node `24.22.1`, Playwright `1.63.0`, Windows `10.0.26200` x64. Every package invocation below explicitly selected pnpm `11.19.0` using `npx --yes pnpm@11.19.0`; the ambient PATH pnpm was `11.25.0` and was not the selected test launcher. Package metadata confirms pnpm 11.19.0 requires Node >=22.13; this Node also satisfies the repository's >=24.19.0 requirement.

All desktop viewports were 1280 × 800. Installed official browser manifest: Chromium/headless shell `153.0.8010.12`, revision `1243`; Firefox `155.0`, revision `1543` (existing Windows project cache selection); WebKit `26.6`, revision `2359`. These are the installed package's manifest versions, not a claim of physical-device/OS certification. [Runtime and pins](smoke-evidence/2026-10-27/runtime-and-pins.json) preserves the entire manifest and metadata.

| Check | Actual result | Native evidence |
| --- | --- | --- |
| `test:smoke --list --reporter=list,json` (build included) | Exit 0; exactly 15, five each in Chromium/Firefox/WebKit, four files | [listing log](smoke-evidence/2026-10-27/listing.log), [native JSON](smoke-evidence/2026-10-27/listing.json) |
| First `test:smoke` (build included), 2026-10-27 06:21:03.569 UTC | Exit 1; **14 passed, 1 failed**, 0 skipped, 0 retries/flaky; 18.022 seconds | [run log](smoke-evidence/2026-10-27/run.log), [native JSON](smoke-evidence/2026-10-27/playwright.json), [native HTML](smoke-evidence/2026-10-27/html/index.html) |
| Initial focused probe with `--grep '^TEST-UI-01 catalogue:'` | Exit 1; **No tests found**. The anchor did not match Playwright's full project/file/title string. This is a selection error, not an app execution or a pass. | [probe log](smoke-evidence/2026-10-27/catalogue-probe/run.log), [native JSON](smoke-evidence/2026-10-27/catalogue-probe/playwright.json) |
| Corrected focused Chromium check with `--grep 'TEST-UI-01 catalogue:' --trace=on`, 06:22:11.234 UTC | Exit 0; **1 passed**, 0 skipped/retries/flaky; 1.447 seconds | [check log](smoke-evidence/2026-10-27/catalogue-check/run.log), [native JSON](smoke-evidence/2026-10-27/catalogue-check/playwright.json), [native HTML](smoke-evidence/2026-10-27/catalogue-check/html/index.html) |
| Workflow local validation and source/evidence assertions | Exit 0; YAML parses; six trigger/branch/tag cases match intended selection; test bodies unchanged; previous Task 1 inventory 42/42 hashes match | [validation](smoke-evidence/2026-10-27/local-validation.json), [checker source](smoke-evidence/2026-10-27/verify-smoke-ci.cjs) |
| Official action/Node/pnpm metadata collection, read-only SQL corroboration | Exit 0; full action SHAs/tag resolutions and action input/runtime metadata verified; three feedback rows | [metadata](smoke-evidence/2026-10-27/runtime-and-pins.json), [collector source](smoke-evidence/2026-10-27/collect-smoke-metadata.cjs) |
| `git diff --check` | Exit 0; normal source line-ending advisories only | Controller can repeat before staging |

The first invocation owned `http://127.0.0.1:53515` and `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio/test-results/owned-databases/run-0Hp2Yg/games.sqlite`. A one-off ignored reporter recorded the actual URL/DB/runtime from global setup, [native provenance](smoke-evidence/2026-10-27/run-provenance.json). Its [preserved source](smoke-evidence/2026-10-27/provenance-reporter.cjs) was used only for this local run; neither application nor package/workflow scripts import it. The corrected focused check used the same owned lifecycle, but its exact DB path was not separately recorded. Native trace retains its navigation URL. Source hashes are [retrospective](smoke-evidence/2026-10-27/source-manifest.json), recorded after both executions, not contemporaneous original-run attestations.

The only complete-smoke failure was Chromium `TEST-UI-01` at the existing `page.screenshot({ fullPage: true })` call, after catalogue titles/genres/order/links/options assertions passed: `Protocol error (Page.captureScreenshot): Unable to capture screenshot`. The native [error context](smoke-evidence/2026-10-27/artifacts/e2e-catalogue-TEST-UI-01-c-aa598-s-and-real-game-links-smoke-chromium/error-context.md) shows a loaded ten-card catalogue; the retained [failure screenshot](smoke-evidence/2026-10-27/artifacts/e2e-catalogue-TEST-UI-01-c-aa598-s-and-real-game-links-smoke-chromium/test-failed-1.png) also shows rendered content. Automatic failure screenshot capture succeeded. [Original trace](smoke-evidence/2026-10-27/artifacts/e2e-catalogue-TEST-UI-01-c-aa598-s-and-real-game-links-smoke-chromium/trace.zip) records the protocol failure; the focused unchanged test successfully captured its full-page image. [Extracted trace events](smoke-evidence/2026-10-27/screenshot-investigation.json) preserve both observations.

This isolates the observed failure to screenshot capture, without proving its underlying cause. No contemporaneous host-resource metrics were captured, so browser/renderer resource pressure or other host activity is not an established cause. The root's manual browser used a separate process/context; it is not evidence of interference. No catch/retry, sleep, assertion removal, viewport change or screenshot removal was introduced. The focused pass does not establish a fix, remove the original failure or supply a passing complete smoke run. No extra 15-test or full-regression invocation was made solely to obtain green evidence. Screenshot stability remains for observation in the planned final clean-checkout/full/CI verification; a recurrence requires renewed diagnosis.

## CI behavior and official pins

[`.github/workflows/tests.yml`](../.github/workflows/tests.yml) runs on standard GitHub-hosted `ubuntu-24.04` with read-only repository permissions, credential persistence disabled, a 20-minute job timeout and a 5-minute artifact-upload timeout. Matrix jobs have separate runners/app processes/ports/owned DBs; each test invocation explicitly uses one worker, zero retries and forbids focused `test.only`. No third-party notification, paid runner, deployment, branch protection change or new project dependency was added.

| Event | Selected jobs |
| --- | --- |
| Push to a nondefault branch or a tag | Smoke |
| Push to the repository's current default branch | Smoke and full |
| Pull request | Full, including the smoke cases |
| Manual workflow dispatch | Smoke and full |

The default branch is read from the GitHub event, not hardcoded to `main`. A tag named like the default branch still selects only smoke. Full invokes the existing complete `pnpm test`, including desktop UI/accessibility, API/database once and Chromium phone layout. Both invocations request native list/HTML/JSON reporters and write to distinct suite directories. An `always()` upload keeps the complete suite directory, including hidden files and native traces/screenshots, for 14 days under `playwright-<smoke|full>-<run_id>-<attempt>`. Early dependency/browser-install failure can leave no test report; the upload warns if no files exist. A cancelled runner or forcibly terminated process can also prevent report finalization. No missing artifact or unexecuted test is represented as a pass.

| Official action | Verified tag | Pinned full commit SHA |
| --- | --- | --- |
| [actions/checkout](https://github.com/actions/checkout/releases/tag/v7.0.1) | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [actions/setup-node](https://github.com/actions/setup-node/releases/tag/v7.1.0) | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

The collector verified each official repo with `git ls-remote` and fetched its `action.yml` at the full SHA; all declare the `node24` action runtime. Native copies are in [official metadata](smoke-evidence/2026-10-27/official-metadata/checkout-action.yml). Node is pinned to `24.22.1`, verified against its [official distribution checksums](https://nodejs.org/dist/v24.22.1/SHASUMS256.txt). pnpm is installed as the declared `11.19.0` using npm, then dependencies use `pnpm install --frozen-lockfile`. Official browsers and Linux OS dependencies use `pnpm exec playwright install --with-deps chromium firefox webkit`, following [Playwright's CI guidance](https://playwright.dev/docs/ci-intro).

Local YAML validation used the already installed Playwright-bundled YAML parser, exact-field assertions and local evaluation of the expression's `&&`/`||`/JSON selection semantics. This is not actionlint, GitHub's expression engine, a Linux run, a fresh install or executed CI. Native action inputs/runtime and tag SHAs were checked separately. Linux installation, runner execution, actual uploads and workflow selection in GitHub remain pending publication/observation.

## Evidence preservation and remaining gates

The dated smoke tree contains unmodified native JSON/HTML, failure artifacts, the focused success trace/image, tooling sources, metadata, logs, [SHA-256 inventory](smoke-evidence/2026-10-27/sha256.json), and [byte-preservation audit](smoke-evidence/2026-10-27/portability.json). `.gitattributes` sets `-text` only for this dated evidence, preventing Git newline normalization from changing recorded bytes. Source-manifest raw hashes are Windows worktree hashes and can differ from normalized Git source blobs. No stage/commit/push was performed by this worker; the controller must verify actual staged blobs before committing. Prior Task 1 native evidence still matches all 42 recorded hashes.

Independent review, any scoped fixes, controller commit, final clean-checkout/full-matrix verification, actual smoke/full CI execution/artifacts, manual screen-reader evidence and the final release audit remain separate gates. This report changes none of their criteria and does not replace historical reports or claim the whole project is complete.

## Recorded verification commands

These are the historical commands, using this run's output paths; do not rerun them over preserved evidence. Run package commands from the repository root with the declared pnpm. The local worker selected it explicitly with `npx --yes pnpm@11.19.0`; no global package or PATH setting was changed.

```powershell
npx --yes pnpm@11.19.0 --version
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-docs/smoke-evidence/2026-10-27/listing.json'
npx --yes pnpm@11.19.0 test:smoke --list --reporter=list,json

$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-docs/smoke-evidence/2026-10-27/playwright.json'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='test-docs/smoke-evidence/2026-10-27/html'
$env:PLAYWRIGHT_HTML_OPEN='never'
npx --yes pnpm@11.19.0 test:smoke --reporter=list,html,json,./test-results/sdd/portfolio-completion-2026-10-26/smoke-provenance-reporter.cjs --output=test-docs/smoke-evidence/2026-10-27/artifacts

# Initial probe: failed selection, no app tests executed.
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-docs/smoke-evidence/2026-10-27/catalogue-probe/playwright.json'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='test-docs/smoke-evidence/2026-10-27/catalogue-probe/html'
npx --yes pnpm@11.19.0 exec playwright test --project=chromium --grep '^TEST-UI-01 catalogue:' --workers=1 --retries=0 --forbid-only --trace=on --reporter=list,html,json --output=test-docs/smoke-evidence/2026-10-27/catalogue-probe/artifacts
# Corrected focused check.
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-docs/smoke-evidence/2026-10-27/catalogue-check/playwright.json'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='test-docs/smoke-evidence/2026-10-27/catalogue-check/html'
npx --yes pnpm@11.19.0 exec playwright test --project=chromium --grep 'TEST-UI-01 catalogue:' --workers=1 --retries=0 --forbid-only --trace=on --reporter=list,html,json --output=test-docs/smoke-evidence/2026-10-27/catalogue-check/artifacts
Remove-Item Env:PLAYWRIGHT_JSON_OUTPUT_NAME
Remove-Item Env:PLAYWRIGHT_HTML_OUTPUT_DIR
Remove-Item Env:PLAYWRIGHT_HTML_OPEN

node test-results/sdd/portfolio-completion-2026-10-26/verify-smoke-ci.cjs
node test-results/sdd/portfolio-completion-2026-10-26/collect-smoke-metadata.cjs
python test-results/sdd/portfolio-completion-2026-10-26/inspect-smoke-traces.py
git diff --check
```

The native logs retain command expansion and results. For another verification, choose a new dated/dedicated output tree rather than overwriting this evidence. The one-off provenance reporter source is preserved for review/recreation; ordinary `pnpm test:smoke` and CI need no temporary files.
