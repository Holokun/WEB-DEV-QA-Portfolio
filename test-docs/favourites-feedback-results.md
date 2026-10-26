# Favourites and feedback — local regression results

On **2026-10-26 (Asia/Yerevan)**, typecheck and build exited 0 and the complete currently implemented suite passed: **559 project executions, 0 failures, 0 skips, 0 flaky results, 0 retries**, in 251.031 seconds (Playwright display: 4.2 minutes). This covers the local application and its actual HTTP/SQLite paths. Automation readiness and portfolio release remain open because required axe, manual and CI work is still pending.

The earlier **2026-10-13** run is a separate historical result: 559 passed in 220.171 seconds (3.7 minutes). Its [runtime](favourites-feedback-evidence/2026-10-13/runtime.json), [SQL snapshot](favourites-feedback-evidence/2026-10-13/sql-snapshot.json), screenshots and original controller JSON/HTML under `test-results/sdd/favourites-feedback-2026-10-12/` remain unchanged. The 26 October run reverified the same source/test/config contents with a newer installed Node runtime; it does not change the date of earlier evidence or discovery.

## Counts and coverage

The approved inventory has **21 entries**. **19 entries** are represented by the implemented suite: TEST-UI-01–14, TEST-API-01–04 and TEST-DATA-01. TEST-A11Y-01/02 are pending. Presence of an ID alone does not close all acceptance gates; the [traceability matrix](traceability-matrix.md) retains the required variants and manual obligations.

The native JSON contains **288 distinct expanded definitions**: 156 API/database and 132 UI definitions. A definition is a unique `(file, line, column, expanded title)` after data-driven expansion, before multiplying across projects. There are **559 project executions**: `156 + 132 × 3 + 7`. Each execution had one attempt. These are different measures from the 21 inventory entries.

**Historical count correction:** the preserved 13 October `execution-summary.json` says 286 definitions. Recounting its native JSON with case-sensitive identity yields 288 using the definition above. Case-insensitive de-duplication merges the deliberate `Genre=Action`/`genre=action` and `ÉCH`/`éch` test-title pairs and yields 286. The original file is retained; the [count audit](favourites-feedback-evidence/2026-10-26/historical-count-audit.json) records the correction. Neither the old nor current 559-execution total changes.

| Project | Executions passed | Viewport scope |
| --- | ---: | --- |
| API/database | 156 | Browser independent; actual HTTP and SQLite |
| Chromium | 132 | Base 1280×800; two explicit 375×812 favourites/feedback checks override it |
| Firefox | 132 | Base 1280×800; the same two explicit 375×812 checks |
| WebKit | 132 | Base 1280×800; the same two explicit 375×812 checks |
| Chromium-phone | 7 | Required layout spec at 375×812 |

The separate phone project runs layout coverage, not the entire UI suite or a real device. The two explicit narrow-viewport checks also run in WebKit, but no separate WebKit-phone project or full mobile certification was run. Playwright uses its own processes and fresh contexts, separate from Vadim's ordinary Firefox session.

Coverage includes catalogue/search/filter and asynchronous response ownership, details/ordered notes and Retry, immediate favourites state/reload/storage recovery/deferred cleanup, shared UI/API email and Unicode validation, value-preserving submission failures, duplicate-submit prevention, navigation ownership, exact insertion checks, schema migration, restart preservation, transactional reset and rollback. Controlled HTTP/network failures and broken isolated SQLite dependencies are identified as test conditions, not discovered production defects.

Task 4 adds header keyboard navigation through Favourites and Feedback, loaded empty-submit validation, entry and successful submission, plus saved-list removal/count/focus and desktop/phone layout. Successful submission checks real HTTP 201, count delta +1 and exact trimmed data selected by the returned ID. Existing required-field, no-request and no-insertion assertions remain. The primary success/dependency titles now expose TEST-API-03/04; no duplicate cases were added. The reviewed loaded-form focus test now waits for Game to be enabled.

## Current native evidence and environment

- [Full log](favourites-feedback-evidence/2026-10-26/full.log), [native JSON](favourites-feedback-evidence/2026-10-26/results.json), [HTML report](favourites-feedback-evidence/2026-10-26/html/index.html) and [derived counts](favourites-feedback-evidence/2026-10-26/execution-summary.json).
- [Typecheck](favourites-feedback-evidence/2026-10-26/typecheck.log), [build](favourites-feedback-evidence/2026-10-26/build.log), [exit codes](favourites-feedback-evidence/2026-10-26/command-exits.json), [runtime](favourites-feedback-evidence/2026-10-26/runtime.json), [actual working-tree source SHA-256](favourites-feedback-evidence/2026-10-26/source-sha256.json) and [pre-run status](favourites-feedback-evidence/2026-10-26/working-tree-status.txt). All 38 hashed source/test/script/config files match the 13 October snapshot; these hashes cover working files rather than only HEAD.
- Windows 11 Pro for Workstations x64, release 10.0.26200; Node **v24.22.1** at `D:\programms\nodejs\node.exe`, pnpm **11.25.0**, Playwright **1.63.0**. The package declares pnpm 11.19.0; this records the actual executable used without changing dependencies.
- Chromium **153.0.8010.12**, Firefox **155.0** (official revision 1543 in the existing project cache), WebKit **26.6**. Runtime JSON records exact executable paths. Earlier 13 October execution used Node v24.19.0; the browser versions were the same.
- Start `2026-10-26T14:39:02.435Z` (18:39:02 Asia/Yerevan); reporter finish `2026-10-26T14:43:13.784Z`. One worker, `fullyParallel: false`, retries 0.
- Base URL `http://127.0.0.1:62310`; absolute owned DB_PATH `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\owned-databases\run-LiFMrx\games.sqlite`. Fixture v1 was reset by the existing suite setup. Mutation/lifecycle/dependency cases used their own owned databases/apps. The human/development database was not targeted.

The first attempt stopped in reporter browser launch before test execution because the sandbox redirected Playwright's cache to an empty sandbox profile. Its [launch log](favourites-feedback-evidence/2026-10-26/sandbox-launch-failure.log) is retained separately (exit 1). Scoped execution using existing installed browsers completed the actual suite (exit 0); no browser installation or product workaround was added. The temporary [metadata reporter](favourites-feedback-evidence/2026-10-26/metadata-reporter.mjs) is evidence instrumentation, not an application dependency. No browser failure trace was generated by the passing run; successful-path PNGs remain in the native artifact directory.

From the repository root, normal reproduction uses `pnpm typecheck`, `pnpm build`, then `pnpm exec playwright test --workers=1` (or `pnpm test`, which builds first). The exact diagnostic invocation and evidence paths are recorded in the Task 4 handoff report. The application still launches through the README's `pnpm dev`; no temporary path is required at runtime.

## Screenshot and SQL review

Representative current PNGs were opened and visually inspected: labelled controls, visible validation/focus and success status, saved cards/count, catalogue and detail at both sizes. Text and controls fit the viewport; phone pages scroll vertically. Full-page PNG height may exceed the configured viewport height. This is visual inspection of execution captures, not an approved pixel-diff baseline or screen-reader assessment. [Provenance](favourites-feedback-evidence/2026-10-26/screenshot-provenance.json) maps the twelve readable copies to native artifacts and their hashes.

| State | Desktop | Phone |
| --- | --- | --- |
| Catalogue | [PNG](favourites-feedback-evidence/2026-10-26/desktop-catalogue-view.png) | [PNG](favourites-feedback-evidence/2026-10-26/phone-catalogue-view.png) |
| Detail | [PNG](favourites-feedback-evidence/2026-10-26/desktop-detail-view.png) | [PNG](favourites-feedback-evidence/2026-10-26/phone-detail-view.png) |
| Favourites | [PNG](favourites-feedback-evidence/2026-10-26/desktop-favourites-view.png) | [PNG](favourites-feedback-evidence/2026-10-26/phone-favourites-view.png) |
| Feedback normal | [PNG](favourites-feedback-evidence/2026-10-26/desktop-feedback-normal.png) | [PNG](favourites-feedback-evidence/2026-10-26/phone-feedback-normal.png) |
| Feedback validation | [PNG](favourites-feedback-evidence/2026-10-26/desktop-feedback-validation.png) | [PNG](favourites-feedback-evidence/2026-10-26/phone-feedback-validation.png) |
| Feedback success | [PNG](favourites-feedback-evidence/2026-10-26/desktop-feedback-success.png) | [PNG](favourites-feedback-evidence/2026-10-26/phone-feedback-success.png) |

[Read-only verification queries](../sql/verification-queries.sql) select catalogue/notes, counts, a feedback row by its actual returned ID, and `sqlite_sequence` as text. The [current SQL snapshot](favourites-feedback-evidence/2026-10-26/sql-snapshot.json) has 10 games, 4 notes, 44 accumulated ordinary feedback rows and feedback sequence 44. The four keyboard submissions have actual IDs 21, 32, 43 and 44 for Chromium, Firefox, WebKit and Chromium-phone. A separate [read-only schema/integrity capture](favourites-feedback-evidence/2026-10-26/integrity-and-schema.json) records `user_version=1`, actual table definitions and those rows queried by ID. These final accumulated counts supplement the per-action returned-ID/count assertions; they do not replace them or imply that each test starts with ID 1.

Storage uses `game-companion:favourites`, a JSON array of positive safe integer IDs, outside SQLite. Routes are `/`, `/#/games/<id>`, `/#/favourites` and `/#/feedback`. Existing databases acquire a missing feedback table without reseeding; startup preserves rows/counter. Explicit owned test reset restores fixture v1 and clears feedback/counter transactionally; it does not clear localStorage. See the [README](../README.md) for absolute DB_PATH ownership/reset and launch commands.

## Defects and remaining gates

[BUG-FAV-01](../bug-reports/BUG-FAV-01-memory-navigation.md) records memory selections lost on ordinary Library navigation after deliberate storage failure. [BUG-API-01](../bug-reports/BUG-API-01-unsafe-feedback-id.md) records a committed unsafe response ID exposed by a deliberately advanced SQLite counter. Both were genuine defects found by assistant review in uncommitted drafts, fixed and re-reviewed before their feature commits. Their original RED/GREEN evidence and the 13 October report-preparation date are preserved; neither is attributed to Vadim's manual session or a shipped incident.

Still pending: TEST-A11Y-01/02 axe implementation/execution; manual screen-reader announcements and full required manual scenarios for new features; required smoke/full CI and fresh-checkout reproduction; The local implementation reviews are complete; the controller records the scoped commits below. Full WCAG compliance, deployment, application to Larian and automatic TestRail publication are not claimed. [Vadim's manual report](manual/testing-session-by-Vadim.md), the [12 October assistant follow-up](manual/follow-up-2026-10-12.md), [historical first-slice results](first-slice-results.md) and Firefox reports retain their original scope and evidence.

## Local execution decisions

These chronological controller notes document local technical choices and their reversible costs. They do not change the agreed architecture, launch, dependencies or acceptance gates. The owner rules introduced on26October require explicit approval before any future deviation and take precedence over skill instructions for autonomous rulings.

- Ruling: continue in main — explicit persistent user preference and the prior approved first-slice plan; avoid copying or resetting existing local work — incorrect preference inference would cost reversible local rework.
- Ruling: keep SDD scratch in this already ignored test-results subdirectory — Windows bash resolves to a WSL launcher; use native Node/PowerShell rather than invoke an unrelated shell — scratch must remain outside test-results/artifacts cleanup.
- Ruling: controller creates only scoped reviewed commits; workers leave changes uncommitted. Preserve pre-existing dirty files; never push or merge automatically.
- Ruling: no renewed approval for the unchanged written product architecture — the latest user instruction directly authorizes this continuation, with the preserved execution method. Any materially new product decision would be surfaced.
- Task 1 Ruling: allow app/api/games.ts type-only ApiResult extension — its existing union is the shared response boundary and must include FeedbackResponse; route/matching logic remains unchanged. Cost if wrong: reversible type-only edit.
- Task 1 fix round 1/5: /root/feedback_api resumed on I1; pre-fix assigned files captured in task-1-review-base. Ruling: reject unsafe allocation with generic error and rollback; preserves existing counter and explicit safe-ID/no-error-insertion contracts.
- Task 2 Ruling: allow narrow additive layout.spec reverse-focus update — detail favourite button adds a legitimate focus stop before the notes region. Assert it before continuing unchanged notes/Back checks; no assertion weakening. Task 4 retains broader keyboard/layout ownership. Cost if wrong: reversible test/placement adjustment.
- Task 2 Ruling: narrow catalogue.spec cleanup-probe interface update plus store-toggle cleanup assertion approved — production shared-model option is intentional; keep original request/destroy checks. Only covering probe needs rerun after test-only change; final full run remains Task 4.
- Task 2 fix round 1/5: original implementer is absent from live agent session after resume; a fresh replacement will use task brief, prior report and review finding, per skill fallback. Ruling: preserve route and shared-store contract using same-document internal navigation; cost if wrong: reversible link/routing change.
- Task 4 Ruling: make file scope explicit, align the existing primary API success title with TEST-API-03, and retain the two genuine pre-commit review defect investigations with native evidence — follows approved inventory and honest portfolio evidence standard; cost if wrong: reversible test-title/report edits. Existing prior manual/Firefox records remain separate.
- Task 4 Ruling: add TEST-API-04 to the existing REQ-API-06 real isolated dependency-failure title — aligns observable inventory with implemented behavior without duplicating or weakening the test; cost if wrong: reversible title edit.
- Task 4 Ruling: resolve Task3 Minor with an explicit Game-enabled wait in the loaded empty-submit check, reviewed as task4 integration change — avoids timing dependence without weakening assertions; cost if wrong: reversible test-only wait. Base for task4 is b5d8556127369b76aa6203c68c33e864305992a8.
- Final review Ruling: include the preserved earlier authorized Firefox setup and QA reports/evidence referenced by README in the whole-change review, then commit them separately if review approves — avoids a committed README depending on untracked local files. No rewriting historical execution or staging unrelated skills/attachments/TestRail export. Cost if wrong: reversible local documentation/setup commit.
- Finish Ruling: keep the main checkout and unique local review snapshots/evidence; there is no disposable worktree and the user explicitly treats documentation as protection against loss. Durable rulings/review summary will be saved with results; cost if wrong: small ignored local disk usage. No push/merge/publication action added.

## Review completion

Task 4 specification/quality review approved the integration with no findings. Whole-change review found no Critical or Important issue and one Minor in the active manual guide; that instruction was corrected and its scoped re-review found M1 addressed with no new issues. No application/test/config source changed after the fresh 559-pass run. Manual outcomes, axe, screen-reader, CI and fresh-checkout gates remain open.

Retained reviews: [API](favourites-feedback-evidence/2026-10-26/review-task-1.md), [API fix](favourites-feedback-evidence/2026-10-26/review-task-1-fix.md), [favourites](favourites-feedback-evidence/2026-10-26/review-task-2.md), [favourites fix](favourites-feedback-evidence/2026-10-26/review-task-2-fix.md), [feedback UI](favourites-feedback-evidence/2026-10-26/review-task-3.md), [integration](favourites-feedback-evidence/2026-10-26/review-task-4.md), [whole change](favourites-feedback-evidence/2026-10-26/review-final.md), [final documentation fix](favourites-feedback-evidence/2026-10-26/review-final-fix.md). Feature commits are bafae84, 2fd7df0 and b5d8556; supporting evidence and final integration are saved in the following scoped local commits, identifiable in Git history. No push, merge or TestRail publication is part of this handoff.

Supporting QA material was saved in local commit a96cc51. The final integration commit is the commit adding this results document and the dated native evidence; Git history supplies its exact ID without a self-referential hash in the document.
