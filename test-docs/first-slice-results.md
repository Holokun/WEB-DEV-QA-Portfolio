# First-slice execution results

Subsequent manual reporting: [Vadim's session](manual/testing-session-by-Vadim.md) and [2026-10-12 assistant follow-up](manual/follow-up-2026-10-12.md) now record separate human observations, 17 follow-up groups with passing latest results and a user-reported network simulation. The historical execution and limitations below remain dated records; the [current coverage review](manual/testing-session-by-Vadim-review.md) describes what this supplement adds and leaves open.

Subsequent executions: the [Firefox-only rerun on 2026-10-05](firefox-rerun-results.md) attempted all 66 checks and reproduced the launch blocker. The [launch repair](firefox-launch-repair.md) first verified two checks. The [full Firefox rerun on 2026-10-06](firefox-regression-results-2026-10-06.md) then passed all 66 existing automated checks, without skips or retries; lifecycle warnings are recorded separately. The complete-suite results and coverage limits below remain the original execution record. No new combined 272-check execution is claimed.

Final isolation follow-up executed on 2026-10-05 against the working tree based on commit `e31ab832b044a35be96b264d018e3fc390891ebb` plus the artifact-cleanup isolation fix. It follows the Task 3 milestone; historical Task 3 reports remain unchanged. This records the catalogue/detail/patch-note slice; the [full test plan](test-plan.md) and its release gates remain open.

## Actual automated results

The controller ran final typecheck, ownership focus, overlap probe and full-suite commands against the implementer's paused isolation-fix tree. The detail/layout focus and dev smoke below are retained earlier Task 3 evidence; UI behavior was unchanged by the isolation fix. Every suite invocation owned its app, available port and absolute SQLite database. Projects ran serially with one worker and fresh browser contexts. Mutation/lifecycle/dependency cases owned separate apps/databases. No development database was reset.

| Command | Observed result |
| --- | --- |
| `pnpm typecheck` | Exit 0, no type diagnostics. |
| `pnpm build` | Exit 0, compilation and static asset copy completed. |
| `pnpm exec playwright test tests/e2e/detail.spec.ts tests/e2e/layout.spec.ts --project=chromium --project=webkit --project=chromium-phone` | Exit 0; 61 passed in 29.4 seconds: Chromium 28, WebKit 28, phone 5. |
| `pnpm test:api --grep 'Suite ownership' --reporter=list` | Build succeeded; exit 0, 1 passed in 553ms after the cleanup-boundary fix. |
| Owned-app overlap probe in ignored SDD scratch | Exit 0 in 1.440s; second actual API invocation passed one check in 514ms; held first app's DB/marker survived and real catalogue remained valid. |
| `pnpm test` | Build succeeded; test exit 1. 272 project executions in 1.5 minutes: 206 passed, 66 failed, 0 skipped. |
| `pnpm dev` with `PORT=0` and explicit isolated `DB_PATH` | Rebuilt, emitted `http://127.0.0.1:60383`; GET `/` returned 200 with title Game Companion, detail 1 returned Orbit, notes 1 returned IDs `[2, 1, 3]`. |

| Full-run project | Viewport | Passed | Failed | Meaning |
| --- | --- | ---: | ---: | --- |
| API | Not applicable | 69 | 0 | Real API/data/static-boundary checks, including normalized cleanup ownership. |
| Chromium desktop | 1280 × 800 | 66 | 0 | Catalogue 38, detail 23, layout/keyboard 5. |
| Firefox desktop | 1280 × 800 | 0 | 66 | Every case failed before page creation with `browserType.launch: spawn UNKNOWN`; behavior coverage is blocked. |
| WebKit desktop | 1280 × 800 | 66 | 0 | Catalogue 38, detail 23, layout/keyboard 5. |
| Chromium phone | 375 × 812 | 5 | 0 | Selected layout/keyboard viewport checks, not physical-device coverage. |

There are 135 distinct case definitions: 69 API, 38 catalogue, 23 detail and 5 layout/keyboard. The 272 project executions are 69 API plus 66 UI cases in each of three desktop projects plus 5 repeated layout/keyboard cases on phone. These are not 272 unique scenarios or completed inventory entries. No required Firefox check is counted as passed or waived. `pnpm install --frozen-lockfile` passed during the API milestone; a fresh clone/install was not repeated for this final run.

## Environment and local evidence

Windows 11 build 26200, PowerShell; Node.js 24.19.0 and pnpm 11.19.0. Pinned dependencies: TypeScript 7.0.2, `@types/node` 24.19.1, Playwright 1.63.0. Playwright's supplied package metadata identifies Chromium/headless shell 153.0.8010.12 revision 1243, Firefox 155.0 revision 1543 and WebKit 26.6 revision 2359. Chromium and WebKit executed; Firefox's listed version does not imply a successful launch.

The suite chooses a loopback URL and an absolute database under `test-results/owned-databases/run-*/games.sqlite`; the separate dev smoke used `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\dev-smoke\games.sqlite`. Following the final isolation fix, Playwright's cleanup and trace/screenshot/error-context directory is explicitly `test-results/artifacts`, outside the owned database directories. The HTML report is in `playwright-report`. These shared artifact/report locations can be overwritten by another invocation, whereas each app/database remains independently owned. Reports are local ignored artifacts, not delivered merely by cloning the repository.

The final isolation full-suite output is retained at `.superpowers/sdd/2026-10-05-catalogue-first-slice/final-fix-full-test.log`; its ownership/probe evidence is summarized in `final-fix-report.md` in the same ignored directory. Historical Task 3 output remains in `task-3-final-test.log` and `task-3-focused-green.log`. Four representative full-page Chromium desktop/phone catalogue/detail screenshots from the earlier real layout check remain in its `task-3-evidence` directory. The handoff reports list local evidence paths. The earlier local preview request was queued; this does not confirm that a browser tab was already shown.

## Selected requirements and variants

| Stable IDs | Implemented and exercised first-slice portions | Remaining limits |
| --- | --- | --- |
| `REQ-CAT-01`–`REQ-CAT-06`; `TEST-UI-01`–`TEST-UI-05`, `TEST-UI-14` | Seeded order, literal/ASCII-only search, exact genre/AND filtering, clear controls, trimmed 80/81 ASCII/emoji boundaries, retained results/count/filter labels, loading/empty/error, current-control Retry, reverse completion and invalid-input ownership. | Required Firefox behavior blocked. |
| `REQ-DET-01`–`REQ-DET-04`; `TEST-UI-06` | Literal Orbit fields, Back, direct entry/reload/history, note IDs `[2, 1, 3]` and literal dates/versions/summaries, game 9 empty notes, separate held loading, detail/notes HTTP 500 and network failure, current-game Retry to content/ordered/empty notes, distinct 404 without available Retry, old successes/failures after A→B and A→B→catalogue navigation. | Firefox blocked. Persisted lifecycle check deliberately dispatches `pagehide`/`pageshow`; native BFCache eligibility is not claimed. |
| GET portions of `REQ-API-01`–`REQ-API-06`; `TEST-API-01`, GET variants of `TEST-API-02`, `TEST-API-04` | Real list/detail/notes, exact fields/order, query/ID/error precedence and envelopes, punctuation/Unicode boundaries, isolated real dependency failure. | No feedback POST, `TEST-API-03` feedback insertion or rejected-body/email variants. |
| Catalogue/detail/notes portions of `REQ-A11Y-01`, `TEST-UI-12` | Accessible names, ordinary Tab/Enter, visible focus on controls/game/Back/notes/Retry, live status and validation association, literal HTML-like fixture text. | Favourites/feedback keyboard variants, Firefox, axe and manual screen-reader work remain open. This does not complete the entry or certify WCAG. |
| Catalogue/detail/notes portions of `REQ-LAY-01`, `TEST-UI-13` | Desktop/phone viewport usability and no horizontal overflow for normal/filtered/loading/error/isolated long title, description, platform and note states. | Feedback layout and Firefox desktop remain open. Optional WebKit phone was not run. |
| Current games/notes portions of `REQ-DATA-01`, `TEST-DATA-01` | First seed, existing-file preservation, owned transactional/idempotent reset, isolated mutation/dependency tests. | Feedback/counter/controlled reset rollback remain future scope; the full entry is incomplete. |

## Controlled simulations and RED/GREEN evidence

The final cleanup ownership regression first failed after successful real setup: the normalized Playwright output directory contained the live database path (expected containment false, actual true). After narrowing output cleanup to `test-results/artifacts`, the focused check passed. A bounded overlap probe held one owned app while a second actual bare-question-mark API suite invocation ran; the held database, owner marker and exact seeded HTTP catalogue survived, and both owned processes stopped independently. This is a held app plus a focused second invocation, not two simultaneous complete suites. Shared artifact/report files may still be overwritten as documented above.

Detail smoke checks preceded source implementation. The first Chromium run built successfully and failed three checks on absent Orbit/Moss Garden headings. The phone long-text check failed after detail render with page width greater than viewport before wrapping styles; it passed afterwards. The first expanded detail run passed 21 of 23 cases; two 404 assertions incorrectly counted a hidden Retry button's raw text. Screenshot/accessibility evidence showed exact visible Game not found copy and no available Retry. The assertions were corrected to check visible exact copy and absence of accessible Retry, retaining Back/content checks. Final results above supersede these intermediate results.

Transient simulations fulfil the specific detail/notes request with a contract-shaped HTTP 500 or abort it at the browser boundary; removal of injection precedes Retry. Stale tests hold real server responses, make cancellation ineffective, complete navigation/current content first, then release the old success or failure. Current content remains authoritative. These are controlled UI simulations, not spontaneous server defects. The separate broken-database test makes real API requests against its isolated failed dependency.

Firefox is an environment blocker. A prior native probe reported an incorrect side-by-side configuration; Windows event 33 identified unresolved `mozglue` assembly 1.0.0.0. This does not establish corruption or security-policy causation. A forced reinstall was rejected before execution; no alternate version, vendor patch or security-setting change followed. All 66 final launch failures are recorded. No application defect count or completed exploratory investigation is invented.

## Implementation review

The implementation used AI-assisted subagent-driven development. Each of the three tasks received an independent specification and code-quality review, followed by a review of the complete implementation range. Review findings led to a live validation announcement fix and a database/artifact cleanup boundary fix. The original implementers made these changes; fresh reviewers checked each fix. The final scoped review accepted both the cleanup fix and the corrected SQLite-lock test description, with no remaining code findings in the reviewed scope. This review does not close the required Firefox verification gate.

## Genuine manual observations and future scope

The controller visually inspected four actual full-page Chromium desktop/phone catalogue/detail screenshots: readable text, aligned controls/cards/notes, no visible overlap/clipping and clean stacking on phone. The implementer inspected desktop detail/notes and phone catalogue/detail images with the same limited observations; the notes 404 image retained Orbit details and Back without visible Retry. These are screenshot observations, separate from automated checks. A full manual keyboard/exploratory session, screen-reader announcements and `SCN-A11Y-01` have not been performed.

Favourites, feedback, authentication, full data lifecycle, axe/full WCAG review, CI, external hosting and gameplay testing remain unimplemented or unverified. The 21-entry inventory, all manual scenarios and portfolio release gate are incomplete. The full suite is not passing because required Firefox coverage remains blocked.
