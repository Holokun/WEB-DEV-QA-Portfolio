# Game Companion

The current executable slice is a local browser catalogue and HTTP API backed by SQLite. Open the server URL to browse ten synthetic games, search titles, and combine search with a genre filter. Game detail and patch-note APIs are available; their browser views and routing are pending the next milestone. Catalogue links already use `/#/games/<id>`. Feedback and favourites are subsequent work.

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

Install the desktop test browsers once with `pnpm exec playwright install chromium firefox webkit`. `test:ui` runs catalogue checks in Chromium, Firefox and WebKit at 1280 × 800; `test:api` runs the browser-independent API project. Run a selected catalogue project with `pnpm exec playwright test tests/e2e/catalogue.spec.ts --project=chromium` after building. The current milestone does not claim phone viewport, full WCAG, or detail/notes browser coverage.

On the verified Windows 11 environment, Playwright 1.63.0's Firefox 155.0 package (`firefox-1543`) currently fails before launching with `spawn UNKNOWN`. A native headless version probe reports an incorrect side-by-side configuration, and the Windows application event identifies unresolved assembly `mozglue` version `1.0.0.0`. Firefox coverage remains required and blocked; browser setup failures are not passing application checks. Chromium and WebKit can be selected with `pnpm exec playwright test tests/e2e/catalogue.spec.ts --project=chromium --project=webkit` after building. The normal clean-checkout browser installation above is still required; no vendor binary, manifest, or Windows security setting was modified.

Catalogue milestone verification on 2026-10-05: typecheck and build passed. The full run completed 179 project executions in 53.4 seconds: API 68, Chromium 37 and WebKit 37 passed; Firefox 37 failed during launch/setup. Total: 142 passed, 37 failed, exit code 1. The full suite and mandatory Firefox behavior remain unverified.

Every suite invocation starts one ordinary app with one available port and a unique absolute SQLite path under `test-results/owned-databases`. Global setup resets that database once before startup; teardown waits for the owned app to stop. Projects and tests run serially with one worker, and browser cases receive fresh contexts. Startup, reset, catalogue mutation, and dependency-failure checks use separate owned databases and servers. They never target the development database. The dependency-failure check drops the games table in its isolated database, then makes real HTTP requests to verify generic `500` errors. Failed browser checks retain a trace and screenshot; the HTML report is written to `playwright-report`.

The catalogue validates search after trimming and counting Unicode code points. Invalid input sends no request, including from genre changes or Retry, and keeps the previous successful results, count, and filter labels visible. Correcting it uses the current genre. Loading, empty results, and request failures have distinct states. Retry uses the current valid controls. Request ownership prevents late responses from replacing a newer state, and fixture text renders literally. Controls and game links support keyboard navigation with visible focus.

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
