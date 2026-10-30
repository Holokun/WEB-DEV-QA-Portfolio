# Game Companion

Hosted CI on2026-10-27: **smoke15/15 and full583/583 passed**, with zero failed/skipped/flaky tests or retry attempts, on Ubuntu24.04 at `09fb1e0`. See [actual GitHub Actions evidence](test-docs/github-actions-results.md). See the [release audit](test-docs/portfolio-readiness.md) for the current verified scope and CI status.

Latest local evidence: the [clean committed checkout](test-docs/clean-checkout-results.md) passed **583 executions across 296 expanded definitions**, representing all 21 inventory entries, API/database once, three desktop engines and Chromium 375×812 layout; no failures, skips or retries. Its [native HTML report](test-docs/clean-checkout-evidence/2026-10-27/html/index.html), [current summary](test-docs/test-summary-report.md) and [saved-vacancy evidence map](main%20goal/portfolio-fit-map-2026-10-27.md) distinguish local results from pending release gates.

Game Companion is a local browser catalogue and HTTP API backed by SQLite. Browse ten synthetic games, search titles, combine search with a genre filter, open game details and follow Patch notes. Save favourites through the card/detail buttons and open `/#/favourites`; send synthetic feedback at `/#/feedback`. Direct `/#/games/<id>` entry and Back/history navigation work. See [current favourites/feedback regression evidence](test-docs/favourites-feedback-results.md) and the historical [first-slice results](test-docs/first-slice-results.md).

Vadim's [manual session from 2026-10-09](test-docs/manual/testing-session-by-Vadim.md) now includes a retrospective charter, observations, debrief and [coverage review](test-docs/manual/testing-session-by-Vadim-review.md). The separate [2026-10-12 assistant follow-up](test-docs/manual/follow-up-2026-10-12.md) records 17 check groups with passing latest results: search boundaries/Unicode, filters, notes, keyboard and viewports, with native evidence and screenshots. One native-select checker failure was diagnosed; only the two keyboard groups were rerun. [SIM-CAT-01](bug-reports/SIM-CAT-01-network-recovery.md) records Vadim's network-recovery confirmation, without an assistant rerun or invented captures. Human and assistant results remain separate; full scenario and release gates remain open. Use the [manual testing guide](test-docs/manual-testing-start.md) to start a separate seeded session.

The associated TestRail project is [Game Companion (P3)](https://deepward.testrail.io/index.php?/projects/overview/3), with [Test Cases in suite 10](https://deepward.testrail.io/index.php?/suites/view/10). Browser access was verified on 2026-10-05. [Project context for Codex](AGENTS.md) records this association; API/MCP authentication and automatic result publication are not configured.

Requires Node.js **24.19.0 or newer** and pnpm **11.19.0**. Dependencies are pinned in `package.json` and `pnpm-lock.yaml`; `pnpm-workspace.yaml` keeps the cache in the ignored project-local `.pnpm-store`.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` builds once and starts the server at `http://127.0.0.1:3000`. It does not watch files. The default database is `data/games.sqlite`. Override `DB_PATH` and `PORT` as needed; `PORT=0` selects an available port, printed in the readiness JSON. A new database receives fixture version 1. Ordinary startup preserves existing games, notes, feedback and its ID counter; older databases gain the missing feedback table without reseeding. Favourites use the JSON array under localStorage key `game-companion:favourites`, independently of SQLite. A storage failure warns the user and retains selections in memory during ordinary internal navigation; explicit reload restores the last successfully saved value.

Examples:

- `GET /api/games` returns `{ games, total, filters }`.
- `GET /api/games?search=Ember&genre=RPG` returns game 6.
- `GET /api/games/1` returns `{ game }` with description, release year, and platforms.
- `GET /api/games/1/patch-notes` returns `{ patchNotes }`, ordered by date descending, then ID descending. Game 9 has no notes.
- `POST /api/feedback` accepts `{ gameId, email, description }` and returns `201 { id }` with one matching SQLite row. Query keys are rejected before strict body validation, which precedes game lookup and insertion. Email and description are trimmed; description requires 20 Unicode code points. See the [exact email rules](test-docs/requirements-and-risks.md#named-email-variants) and [SQL verification queries](sql/verification-queries.sql).

Search is trimmed, limited to 80 Unicode code points, and matched as a literal substring with only ASCII letters folded. Genre is an exact, untrimmed value: `Action`, `Adventure`, `Puzzle`, `Racing`, `RPG`, or `Strategy`; empty values remove their filter. List keys are case-sensitive and may occur once. Detail and notes accept no query keys. IDs must be positive decimal safe integers without leading zeroes. Errors use `{ error: { code, message } }`; malformed IDs precede query validation, and query validation precedes database access.

```powershell
pnpm typecheck
pnpm build
pnpm test:smoke
pnpm test:api
pnpm test:ui
pnpm test
```

Install the test browsers once with `pnpm browsers:install`; use `pnpm browsers:install firefox` for Firefox alone. On Windows, this installs the official pinned Firefox in the ignored project-local `.playwright-browsers` cache, which the Firefox project selects automatically. Chromium and WebKit keep their normal cache. Other operating systems and explicit `PLAYWRIGHT_BROWSERS_PATH` overrides keep Playwright's standard behavior. No subscription or additional package is needed. `test:ui` runs catalogue/detail/notes, favourites, feedback and keyboard/layout checks in Chromium, Firefox and WebKit at 1280 × 800, plus the Chromium phone layout project at 375 × 812. `test:api` runs the browser-independent API/database project. Phone coverage is a viewport check; it does not represent a physical device or the whole desktop suite on phones. Playwright launches its own browser processes separately from the ordinary Firefox session.

`pnpm test:smoke` builds and selects exactly five existing primary successful paths (`TEST-UI-01/02/06/07/11`) in Chromium, Firefox and WebKit: **15 executions**, one worker and zero retries. Feedback includes the real `201` response ID, exactly one new SQLite row and trimmed-field verification. `pnpm test:smoke --list` lists the selection without running it. Validation, error, recovery and empty-state variants remain in `pnpm test`. The [smoke/CI report](test-docs/smoke-ci-results.md) records the first local run honestly: 14 passed and one Chromium screenshot-capture failure; its focused unchanged reproduction passed. That is not a passing complete smoke run.

[GitHub Actions](.github/workflows/tests.yml) configures smoke on every push, full regression on pull requests and default-branch pushes, and both on manual dispatch. Each job uses Ubuntu 24.04, pinned Node 24.22.1 and pnpm 11.19.0, a frozen lockfile and official Playwright browsers installed with Linux dependencies. Jobs keep one worker, zero retries and independently owned app/database lifecycles. Native HTML/JSON plus available failure traces/screenshots are uploaded after success or failure under distinct smoke/full artifact names for 14 days. Installation failures can leave no test report; upload reports that absence. Owner-approved publication and the first actual hosted smoke/full execution are now recorded in the [CI results](test-docs/github-actions-results.md); results apply to their exact SHA.

The [Firefox launch repair](test-docs/firefox-launch-repair.md) uses the same official Firefox 155.0 revision `1543` in a different cache location. On the verified Windows 11 host, the user-cache executable fails SxS activation for `mozglue`; the project-cache executable launches. The exact Windows cause of that location-dependent failure remains undetermined. Production browser files and Windows security settings were not patched. The [full Firefox rerun on 2026-10-06](test-docs/firefox-regression-results-2026-10-06.md) passed **all 66 existing checks in 41.3 seconds**, with no failures, skips or retries. Browser diagnostics, including lifecycle warnings, are recorded separately in that report. Full-version inventory and release gates remain open.

A [Firefox-only rerun on 2026-10-05](test-docs/firefox-rerun-results.md), after installation of ordinary Firefox 157, built successfully and attempted all 66 desktop checks: 0 passed, 66 launch failures, 0 skipped, exit 1. Playwright still selected its separate Firefox 155 package; no application behavior was reached. Other projects were not rerun, and this result does not establish a new complete-suite result.

Historical first-slice verification on 2026-10-05 after the database isolation fix: typecheck and build passed. `pnpm test` completed 272 project executions across 135 distinct case definitions in 1.5 minutes: API 69, Chromium desktop 66, WebKit desktop 66 and Chromium phone 5 passed; Firefox desktop 66 failed during launch/setup. Total: 206 passed, 66 failed, exit code 1. No other project failed. The subsequent Firefox-only passing result above does not establish a new complete-suite execution; other projects were not rerun. The earlier separate `pnpm dev` smoke run rebuilt and served the UI, Orbit detail and ordered notes on an available port with an explicit isolated database.

Every suite invocation starts one ordinary app with one available port and a unique absolute SQLite path under `test-results/owned-databases`. Global setup resets that database once before startup; teardown waits for the owned app to stop. Projects and tests run serially with one worker, and browser cases receive fresh contexts. Startup, reset, catalogue mutation, and dependency-failure checks use separate owned databases and servers. They never target the development database. The dependency-failure check drops the games table in its isolated database, then makes real HTTP requests to verify generic `500` errors. Failed browser checks retain a trace and screenshot in `test-results/artifacts`; the HTML report is written to `playwright-report`.

Playwright clears only `test-results/artifacts` before a run. Owned database directories are siblings outside that cleanup boundary, so another invocation's database and ownership marker remain intact. Test artifacts and the HTML report use shared locations and may be overwritten by another run; they are not durable per-run evidence. Preserve needed reports separately. Database paths and app processes remain independently owned by each invocation.

A focused runtime ownership check passed after the fix. A separate overlap probe held one owned app while a second actual API test invocation completed; the first database, ownership marker and real catalogue response remained valid. This checks a held app plus a focused second suite, not two simultaneous complete suites.

The catalogue validates search after trimming and counting Unicode code points. Invalid input sends no request, including from genre changes or Retry, and keeps the previous successful results, count, and filter labels visible. Correcting it uses the current genre. Loading, empty results, and request failures have distinct states. Retry uses the current valid controls. Request ownership prevents late responses from replacing a newer state, and fixture text renders literally. Controls and game links support keyboard navigation with visible focus.

Game details show the matching title, genre, fictional description, release year and platforms. Follow Patch notes to load that game's notes independently. Notes failures keep successful details and Back navigation usable; Retry recovers the current request. A known game without notes has an explicit empty state. A `404` shows Game not found and offers Back without Retry. Navigation destroys the previous view and invalidates both requests; persisted browser-history restoration remounts the current route. Data renders as text.

To explicitly reset a separate test database, first designate an owned directory, then pass its absolute database path. For example, from the repository root in PowerShell:

```powershell
$testDirectory = Join-Path (Get-Location).Path 'test-results/manual-owned-test'
New-Item -ItemType Directory -Force -Path $testDirectory | Out-Null
[IO.File]::WriteAllText((Join-Path $testDirectory '.game-companion-test-owner'), "game-companion-test-database-v1`n")
$env:DB_PATH = Join-Path $testDirectory 'games.sqlite'
pnpm reset:test-db
Remove-Item Env:DB_PATH
```

Stop any app using that database before resetting it. Reset requires an absolute path beneath an explicitly designated test directory, refuses the ordinary development target and database symlinks, restores every game/note field, clears feedback and its counter in one transaction, and is idempotent. The reset-only `beforeCommit` callback tests rollback of all rows/counter when an isolated pre-commit failure occurs; normal application/API operation does not expose it. Reset does not clear browser localStorage.

Only allowlisted UI assets can be served from the built UI directory. HTML, CSS and scripts are local; no game assets or external service are required. The server is for local development, with no production-hosting claim.

The [historical favourites/feedback report](test-docs/favourites-feedback-results.md) retains559/288/19 results from 2026-10-26. The [fresh clean-checkout report](test-docs/clean-checkout-results.md) records583/296/all 21, including axe and all 15 tagged smoke paths within the full run. [Final source/evidence review](test-docs/clean-checkout-evidence/2026-10-27/whole-change-review.md) and [hosted smoke/full CI](test-docs/github-actions-results.md) passed at their recorded revisions. Keyboard/focus paths and axe checks have recorded evidence. Full WCAG compliance, real devices, security/performance certification and gameplay testing are not established. No automatic TestRail result publication, Larian application or deployment has been performed.
