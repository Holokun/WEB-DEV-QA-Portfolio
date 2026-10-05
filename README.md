# Game Companion

The current executable slice is a local HTTP catalogue API backed by SQLite. It provides ten synthetic games, game details, and patch notes. The browser UI and feedback endpoint are subsequent work.

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
pnpm test
```

The current suite uses the browser-independent Playwright `api` project with one worker. Each worker owns an available port, child server process, and unique absolute SQLite path under `test-results/owned-databases`. It resets the ordinary database once before startup and stops its process after use. Startup, reset, catalogue mutation, and dependency-failure checks use separate owned databases and servers. They never target the development database. The dependency-failure check drops the games table in its isolated database, then makes real HTTP requests to verify generic `500` errors.

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

Only allowlisted UI assets can be served from the built UI directory when present. The current API foundation has no home page. The server is for local development, with no production-hosting claim.
