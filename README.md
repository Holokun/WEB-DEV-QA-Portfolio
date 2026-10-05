# Game Companion

The first slice is a local browser catalogue and HTTP API backed by SQLite. Browse ten synthetic games, search titles, combine search with a genre filter, open game details and follow Patch notes. Direct `/#/games/<id>` entry and Back/history navigation work. Feedback and favourites are subsequent work. See [actual results and coverage limits](test-docs/first-slice-results.md).

Requires Node.js **24.19.0 or newer** and pnpm **11.19.0**. Dependencies are pinned in `package.json` and `pnpm-lock.yaml`; `pnpm-workspace.yaml` keeps the cache in the ignored project-local `.pnpm-store`.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` builds once and starts the server at `http://127.0.0.1:3000`. It does not watch files. The default database is `data/games.sqlite`. Override `DB_PATH` and `PORT` as needed; `PORT=0` selects an available port, printed in the readiness JSON. A new database receives fixture version 1. Ordinary startup preserves existing records, including changed, added, and deleted games and notes.

Examples:

- `GET /api/games` returns `{ games, total, filters }`.
- `GET /api/games?search=Ember&genre=RPG` returns game 6.
- `GET /api/games/1` returns `{ game }` with description, release year, and platforms.
- `GET /api/games/1/patch-notes` returns `{ patchNotes }`, ordered by date descending, then ID descending. Game 9 has no notes.

Search is trimmed, limited to 80 Unicode code points, and matched as a literal substring with only ASCII letters folded. Genre is an exact, untrimmed value: `Action`, `Adventure`, `Puzzle`, `Racing`, `RPG`, or `Strategy`; empty values remove their filter. List keys are case-sensitive and may occur once. Detail and notes accept no query keys. IDs must be positive decimal safe integers without leading zeroes. Errors use `{ error: { code, message } }`; malformed IDs precede query validation, and query validation precedes database access.

```powershell
pnpm typecheck
pnpm build
pnpm test:api
pnpm test:ui
pnpm test
```

Install the test browsers once with `pnpm exec playwright install chromium firefox webkit`. `test:ui` runs catalogue/detail/notes and keyboard/layout checks in Chromium, Firefox and WebKit at 1280 × 800, plus the Chromium phone layout project at 375 × 812. `test:api` runs the browser-independent API project. Phone coverage is a viewport check; it does not represent a physical device or the whole desktop suite on phones. After building, select available projects with `pnpm exec playwright test --project=api --project=chromium --project=webkit --project=chromium-phone`.

On the verified Windows 11 environment, Playwright 1.63.0's Firefox 155.0 package (`firefox-1543`) currently fails before launching with `spawn UNKNOWN`. A native headless version probe reports an incorrect side-by-side configuration, and the Windows application event identifies unresolved assembly `mozglue` version `1.0.0.0`. Firefox coverage remains required and blocked; browser setup failures are not passing application checks. The normal clean-checkout browser installation above is still required; no vendor binary, manifest, or Windows security setting was modified.

First-slice verification on 2026-10-05 after the database isolation fix: typecheck and build passed. `pnpm test` completed 272 project executions across 135 distinct case definitions in 1.5 minutes: API 69, Chromium desktop 66, WebKit desktop 66 and Chromium phone 5 passed; Firefox desktop 66 failed during launch/setup. Total: 206 passed, 66 failed, exit code 1. No other project failed. The mandatory Firefox behavior and full-version release gates remain open; the full suite is not passing. The earlier separate `pnpm dev` smoke run rebuilt and served the UI, Orbit detail and ordered notes on an available port with an explicit isolated database.

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

Stop any app using that database before resetting it. Reset requires an absolute path beneath an explicitly designated test directory, refuses the ordinary development target and database symlinks, restores every game/note field in a transaction, and is idempotent. It currently supports only games and patch notes. Feedback rows, feedback ID counters, and the planned controlled rollback variant remain outside this slice; `TEST-DATA-01` is not claimed fully complete.

Only allowlisted UI assets can be served from the built UI directory. HTML, CSS and scripts are local; no game assets or external service are required. The server is for local development, with no production-hosting claim.

Favourites, feedback, authentication, the full feedback/counter/rollback data lifecycle, axe scans, manual screen-reader review, full WCAG assessment, CI, external hosting and gameplay testing are unimplemented or unverified future scope. The selected catalogue/detail/notes portions of `TEST-UI-12` and `TEST-UI-13` do not complete those broader inventory entries.
