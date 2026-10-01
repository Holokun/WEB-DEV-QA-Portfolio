# Game Companion — Test Plan

Status: **Design draft; tests have not been implemented or executed.** The repository currently contains planning documents only. Commands, fixture IDs, tool versions, and evidence links must be supplied by the implementation and execution owners before a run is claimed.

Sources: [project plan](../PROJECT_PLAN.md), [requirements and risks](requirements-and-risks.md), [manual scenarios](test-scenarios.md), and [traceability](traceability-matrix.md). Task ownership is in the [chat task plan](chat-task-plan.md).

## Objective and scope

Demonstrate a reproducible QA workflow for a small game companion app. Verify observable behavior, API contracts, persisted data, and recovery from controlled failures; retain evidence that a reviewer can follow.

| In scope | Planned coverage |
| --- | --- |
| Catalogue and search/filter | Loading, exact/partial ASCII-case matching, AND combinations, clearing controls, code-point boundaries, empty/error states, Retry, invalid-input precedence, and late responses. |
| Game detail and patch notes | Matching content, date/ID order, no notes, separate loading/error/Retry, unknown game, and navigation during pending requests. |
| Favourites | Add/remove, reload, malformed storage, invalid/duplicate IDs, complete-catalogue validation, and retention during filtered/failed requests. |
| Feedback | Required fields, EMAIL-01 through EMAIL-27, trim/code-point boundaries, success, failure preservation, API validation, and SQL verification. |
| API | Response schemas/order, endpoint-specific query keys, ID ranges, error codes/precedence, rejected-body non-insertion, and safe dependency failure. |
| Data lifecycle | Exact new-database seed, existing-database preservation, complete transactional reset, repeat reset, ID counter, and rollback. |
| Access and layout | Three-browser desktop UI/keyboard/axe coverage, Chromium phone layout, manual focus and screen-reader review. |

Out of scope for version one: authentication, accounts, administration, third-party integrations, load/performance certification, a comprehensive security audit, full mobile regression, real devices, and operating-system coverage certification. One or two stable visual snapshots may be added after the core suite is reliable; they are optional.

## Priorities and approach

Run the primary successful paths of `TEST-UI-01`, `TEST-UI-02`, `TEST-UI-06`, `TEST-UI-07`, and `TEST-UI-11` as smoke. The feedback smoke path includes its matching SQL row. Validation, recovery, error, and empty-state variants of these entries run in full regression.

Full regression includes all 21 inventory entries and their named variants, including the smoke paths. Inventory entries, distinct variants, and browser executions are different counts; report each separately. An entry with multiple variants is complete only when its required variants are accounted for.

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
- Before ordinary tests, stop and await any owned app, reset the dedicated test database, start the app, and wait for readiness. Ordinary feedback cases share this database, use unique values, and do not assume a new ID of `1`.
- Mutation, startup/reset, and server-dependency failure cases own isolated per-test databases/apps. New-database startup skips reset and begins at a nonexistent path. Other isolated cases reset before setup; stop and await their app before an in-test reset and restart as needed.
- Reset must restore every seeded field/ID, remove additions, clear feedback, and reset its counter in one transaction. A repeat reset returns the same contents; an injected pre-commit failure leaves rows and counter unchanged.
- SQL assertions open the same explicit database used by the request. Capture rows/count before invalid submissions and verify no insertion afterwards; use unique payloads to verify accepted submissions.
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
| Requirements/design | Current three source documents and the five review findings. | Browser/query/failure/email decisions agree across documents; every requirement has planned automation and a manual scenario; plan and scenario files exist; review finds no unresolved scope conflict. |
| Initial manual pass | Runnable minimal app; documented start/reset commands; fixed seed and expected results; UI/API contract implemented for the features under review. | Required scenarios attempted with results or explicit blocks; focused exploratory notes and at least one evidenced investigation recorded. |
| Automation readiness | Manual pass identifies usable behavior; test runner owns app/database; reset/isolation and failure mechanisms are available. | Five smoke paths and all 21 inventory entries/required variants implemented; appropriate local checks pass; failures retain evidence. |
| Portfolio release | Reproducible clean checkout and required CI jobs available. | Latest required smoke/full CI run passes with no required skip; high-risk scenarios have execution evidence; keyboard/screen-reader review is recorded; no unresolved high-impact defect; summary honestly records remaining limitations and optional coverage. |

Lower-impact open defects must have severity, impact, and a documented disposition before release. If a required browser, scenario, or dependency cannot run, mark it blocked and keep the release gate open; do not count it as passed. Optional WebKit phone and visual checks are recorded separately and do not block the required scope.

## Reporting and ownership

Each executing chat reports what was run, what passed/failed/was blocked, evidence links, and remaining work. The documentation coordinator maintains shared decisions; file ownership and prompts are in [chat-task-plan.md](chat-task-plan.md).

The eventual `test-summary-report.md` records requirement coverage, entry/variant/project counts, actual environment, manual/exploratory results, defects versus simulations, optional coverage, and limitations. The eventual README documents verified commands and evidence. Neither is an execution claim in this design phase.
