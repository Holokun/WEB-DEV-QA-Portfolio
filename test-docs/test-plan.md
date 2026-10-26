# Game Companion — Test Plan

Status: **First catalogue/detail/patch-note slice implemented and executed; full-version test plan remains open.** [First-slice results](first-slice-results.md) and the [2026-10-05 Firefox rerun](firefox-rerun-results.md) record historical launch failures. After the [launch repair](firefox-launch-repair.md), the [full Firefox rerun on 2026-10-06](firefox-regression-results-2026-10-06.md) passed all 66 existing automated checks, without skips or retries. Diagnostic lifecycle warnings are recorded for triage. Other projects were not rerun. Future features and required full-version acceptance/release gates below remain unchanged; this slice does not complete the full test plan.

Current implementation includes favourites, feedback and the complete feedback/counter/reset lifecycle. The [regression report](favourites-feedback-results.md) separates the 2026-10-13 run from fresh verification on 2026-10-26: 559 passed across 288 expanded definitions, representing 19 of 21 inventory entries. It records keyboard feedback/header navigation, real SQL checks, and desktop/phone evidence. Historical results above describe their original scope. The full plan remains open for the two axe inventory entries, manual screen-reader review, required CI and release gates; no pending activity is counted as passed.

Latest manual reporting: the [polished Vadim session](manual/testing-session-by-Vadim.md), [separate 2026-10-12 assistant checks](manual/follow-up-2026-10-12.md) and [user-reported network simulation](../bug-reports/SIM-CAT-01-network-recovery.md) document partial first-slice coverage. The [coverage review](manual/testing-session-by-Vadim-review.md) retains the unexecuted portions; no full manual or release gate closure is inferred.

Sources: [project plan](../PROJECT_PLAN.md), [requirements and risks](requirements-and-risks.md), [manual scenarios](test-scenarios.md), and [traceability](traceability-matrix.md). Task ownership is in the [chat task plan](chat-task-plan.md).

## Objective and scope

Demonstrate a reproducible QA workflow for a small game companion app. Verify observable behavior, API contracts, persisted data, and recovery from controlled failures; retain evidence that a reviewer can follow.

| In scope                    | Planned coverage                                                                                                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogue and search/filter | Loading, exact/partial ASCII-case matching, AND combinations, clearing controls, code-point boundaries, empty/error states, Retry, invalid-input precedence, and overlapping valid requests completed in reverse order (including late successes and failures). |
| Game detail and patch notes | Matching content, date/ID order, no notes, separate loading/error/Retry, unknown game, and navigation during pending requests.                                                                                                                                  |
| Favourites                  | Add/remove, reload, malformed storage, invalid/duplicate IDs, complete-catalogue validation, and retention during filtered/failed requests.                                                                                                                     |
| Feedback                    | Required fields, EMAIL-01 through EMAIL-27, trim/code-point boundaries, success, failure preservation, API validation, and SQL verification.                                                                                                                    |
| API                         | Response schemas/order, endpoint-specific query keys, ID ranges, error codes/precedence, rejected-body non-insertion, and safe dependency failure.                                                                                                              |
| Data lifecycle              | Exact new-database seed, existing-database preservation, complete transactional reset, repeat reset, ID counter, and rollback.                                                                                                                                  |
| Access and layout           | Three-browser desktop UI/keyboard/axe coverage, Chromium phone layout, manual focus and screen-reader review.                                                                                                                                                   |

Out of scope for version one: authentication, accounts, administration, third-party integrations, load/performance certification, a comprehensive security audit, full mobile regression, real devices, and operating-system coverage certification. One or two stable visual snapshots may be added after the core suite is reliable; they are optional.

## Priorities and approach

Run the primary successful paths of `TEST-UI-01`, `TEST-UI-02`, `TEST-UI-06`, `TEST-UI-07`, and `TEST-UI-11` as smoke. The feedback smoke path includes its matching SQL row. Validation, recovery, error, and empty-state variants of these entries run in full regression.

Full regression includes all 21 inventory entries and their named variants, including the smoke paths. Inventory entries, distinct variants, and browser executions are different counts; report each separately. An entry with multiple variants is complete only when its required variants are accounted for.

`TEST-UI-12` automates keyboard-only operation of catalogue search/filter and game links, detail and patch-note links, Back/page navigation, favourites add/remove, feedback entry/submission, and catalogue/detail/notes Retry. Verify accessible names, logical focus order, and visible focus in all three desktop browsers. `SCN-A11Y-01` supplements this automation with manual keyboard/focus and screen-reader announcement review; screen-reader review remains manual.

Use manual scenarios before building broad automation. Prioritize incorrect combined results, lost favourites, invalid/lost feedback, misleading API failures, stale detail responses, and database lifecycle corruption. Add an exploratory session around slow/failing requests and navigation; record the charter, observations, and investigated hypotheses when executed.

## Browser and viewport coverage

| Project / activity | Browser | Viewport | Required runs |
| --- | --- | --- | --- |
| Desktop smoke | Chromium, Firefox, WebKit | 1280 x 800 | Every push; also included in full regression. |
| Full desktop UI regression | Chromium, Firefox, WebKit | 1280 x 800 | Pull requests and pushes to the default branch. Includes `TEST-UI-13` desktop, keyboard, and both axe entries. |
| Phone layout (`TEST-UI-13` phone) | Chromium | 375 x 812 | Full regression. Search/filter, cards, detail, and feedback must remain usable without horizontal overflow. |
| Optional phone layout | WebKit | 375 x 812 | Only if supported reliably; report run/not run and reason. Does not gate required coverage. |
| API/database | One browser-independent project | Not applicable | Once per full-regression invocation. Do not duplicate across browsers. |
| Manual keyboard/focus | Chromium initially | Desktop and phone layout as applicable | Initial manual pass and relevant UI changes; automated keyboard checks still run in all desktop browsers. |
| Manual screen-reader review | One available browser/screen-reader pairing | Desktop | Record the actual pairing and versions. Review announcements and validation associations. |

Three-browser coverage applies to desktop. The required phone check is a viewport-based responsive check in Chromium; it does not imply the full suite in three phone browsers or coverage of physical devices.

Record the commit/build, operating system, Node/Playwright versions, installed browser revisions, viewport, screen reader (where used), base URL, and database path for each execution. Pin dependencies and record the CI environment when implementation chooses them; this draft does not prescribe unverified versions.

## Data, environment, and isolation

- Use synthetic feedback only. Version 8–12 games and several notes with exact IDs and values satisfying the [fixture prerequisites](requirements-and-risks.md#seed-fixture-prerequisites). Record literal expected ID lists for search/filter, non-ASCII ordering, equal title keys, equal-date notes, and no-notes results.
- One suite invocation owns one app process, available port, base URL, and absolute `DB_PATH`. Use `workers: 1`, with no overlapping browser projects against that database. Separate CI jobs/invocations own different paths and processes.
- Before ordinary tests, stop and await any owned app, reset the dedicated test database, start the app, and wait for readiness. Ordinary feedback cases share this database and use unique synthetic descriptions, except for fixed boundary inputs under the [feedback verification rules](requirements-and-risks.md#feedback-test-data-and-insertion-verification). Do not assume a new ID of `1`.
- Mutation, startup/reset, and server-dependency failure cases own isolated per-test databases/apps. New-database startup skips reset and begins at a nonexistent path. Other isolated cases reset before setup; stop and await their app before an in-test reset and restart as needed.
- Reset must restore every seeded field/ID, remove additions, clear feedback, and reset its counter in one transaction. A repeat reset returns the same contents; an injected pre-commit failure leaves rows and counter unchanged.
- SQL assertions open the same explicit database used by the request. Capture rows/count before rejected validation submissions and verify no insertion afterwards. For every accepted submission, capture the before/after feedback row counts, require an increase of exactly one, and query by the returned `201` record ID to verify game ID and trimmed email/description. Fixed description-boundary inputs may repeat across UI/API/browser runs and must not gain a unique suffix.
- Each browser test uses a fresh browser context. Set or clear favourites storage explicitly for its preconditions; database reset does not clear browser storage.
- App startup must preserve an existing database. Test reset operates only on a dedicated test database. Test-only failure hooks are documented and unavailable in normal app operation.

The detailed [database rules](requirements-and-risks.md#database-initialization-and-test-reset) remain authoritative. Do not replace serial execution with overlapping projects against the same database.

## Controlled failures and evidence

For UI checks, hold/release, fulfil with a contract-shaped `500`, or abort the specific request through the test/browser tooling. Fail catalogue, detail, notes, and feedback separately. Restore the successful response before Retry. Record the URL, injected condition, recovery action, and resulting behavior. A `404` is distinct from transient failure and has no detail/notes Retry.

For `TEST-API-04`, fail a documented server dependency in an isolated app/database and make an actual request to that server; a mocked client response does not verify server error handling. For reset rollback, inject failure after changes begin and before commit through the test reset mechanism. Record the hook and prove rollback with rows and counter state.

Retain a Playwright HTML report for each CI run and trace/screenshot evidence for browser failures; keep API/SQL output and process/reset logs where relevant. Record build, test/variant ID, project, expected/actual result, and evidence location. Never label planned checks as passed.

Use `BUG-` for genuine defects and `SIM-` for controlled failure investigations. Record simulations separately from defects. Root-cause claims require evidence; otherwise label them hypotheses. Completion requires a useful investigation, not a fabricated minimum defect count.

## Entry and exit criteria

| Gate | Entry | Exit |
| --- | --- | --- |
| Requirements/design | Current versions of [PROJECT_PLAN.md](../PROJECT_PLAN.md), [requirements-and-risks.md](requirements-and-risks.md), [test-plan.md](test-plan.md), [test-scenarios.md](test-scenarios.md), [traceability-matrix.md](traceability-matrix.md), and [chat-task-plan.md](chat-task-plan.md); the [original five review findings](chat-task-plan.md#current-state-and-the-five-findings) and any subsequent documented consistency findings. | Browser/query/failure/email and catalogue response-order decisions agree across these documents; every requirement has planned automation and a manual scenario; review finds no unresolved scope conflict or coverage gap. |
| Initial manual pass | Runnable minimal app; documented start/reset commands; fixed seed and expected results; UI/API contract implemented for the features under review. | Required scenarios attempted with results or explicit blocks; focused exploratory notes and at least one evidenced investigation recorded. |
| Automation readiness | Manual pass identifies usable behavior; test runner owns app/database; reset/isolation and failure mechanisms are available. | All 21 inventory entries and every required variant, including the five smoke paths, are implemented and pass locally with no required skip under the specified browser/viewport coverage; the full suite runs from a clean seeded test database; failures retain evidence. |
| Portfolio release | Reproducible clean checkout and required CI jobs available. | Latest required smoke/full CI run passes with no required skip; high-risk scenarios have execution evidence; keyboard/screen-reader review is recorded; no unresolved high-impact defect; summary honestly records remaining limitations and optional coverage. |

Lower-impact open defects must have severity, impact, and a documented disposition before release. If a required browser, scenario, or dependency cannot run, mark it blocked and keep the release gate open; do not count it as passed. Optional WebKit phone and visual checks are recorded separately and do not block the required scope.

## Reporting and ownership

Each executing chat reports what was run, what passed/failed/was blocked, evidence links, and remaining work. The documentation coordinator maintains shared decisions; file ownership and prompts are in [chat-task-plan.md](chat-task-plan.md).

The current [favourites/feedback report](favourites-feedback-results.md) and README document local commands, requirement coverage, entry/definition/project counts, actual environment, review defects versus controlled failures, and remaining limits. The eventual `test-summary-report.md` will consolidate manual/exploratory, CI and release evidence when those gates are executed.
