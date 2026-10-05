# Catalogue First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally runnable catalogue with search/genre filters, game details, patch notes, a real HTTP API, deterministic SQLite data, and focused verification.

**Architecture:** One Node.js HTTP server serves the JSON API and compiled static UI on the same origin. The UI uses semantic HTML, CSS and browser TypeScript with a hash-based detail route. SQLite stores the versioned synthetic fixtures; no external game service is involved.

**Tech Stack:** Node.js 24 LTS (minimum 24.19.0), built-in `node:http` and `node:sqlite`, TypeScript, pnpm, Playwright. Use compiler output and a small asset-copy script; no UI framework or application bundler is needed for this slice.

**Spec:** [Acceptance criteria and API contract](../../../test-docs/requirements-and-risks.md), interpreted within the [first implementation milestone](../../../PROJECT_PLAN.md#recommended-working-order). Existing acceptance rules remain authoritative.

**Status:** Prepared for user review. The user has selected subagent-driven-development and work in `main`; implementation starts after review of this written plan. No product implementation or test execution is claimed here.

## Global Constraints

- Implement `REQ-CAT-01` through `REQ-CAT-06`, `REQ-DET-01` through `REQ-DET-04`, and the GET endpoint portions of `REQ-API-01` through `REQ-API-06`.
- Implement only the catalogue/detail/notes portions of layout and basic access. Favourites, feedback, authentication, full WCAG review, axe scans, GitLab, CI hosting and gameplay testing are subsequent work.
- Use TypeScript for API, UI and tests; SQLite for games and patch notes. No paid services, external API keys or remote game assets.
- Preserve search trim, 80 Unicode code points, ASCII-only case folding, literal substring matching, strict untrimmed genre values, and exact error/status precedence from the spec.
- Catalogue order is folded Unicode code-point order, then numeric game ID ascending. Patch-note order is date descending, then note ID descending.
- Desktop checks use Chromium, Firefox and WebKit at 1280 x 800. The phone check uses Chromium at 375 x 812 and is labelled viewport coverage.
- Use `workers: 1`; no overlapping projects share an app/database. Every suite invocation owns its app, available port and explicit absolute `DB_PATH`; startup, reset and dependency-failure checks use separate per-test apps/databases.
- Preserve existing database contents on ordinary startup. Provide a dedicated transactional test reset for current games/notes; do not claim the future feedback/counter/rollback inventory entry complete.
- UI strings are English. Use accessible names, keyboard navigation, visible focus, perceivable status messages and `textContent` for data. No raw data interpolation into `innerHTML`.
- Keep requirement/test/scenario IDs stable. Report variants separately; no full inventory entry is marked complete while any required future variant is missing.
- Work in the current checkout on `main` as explicitly selected by the user. Preserve the `documentation` branch and Git history. Commit reviewed milestones separately; no automatic push to shared main in this plan.
- Each worker receives only its task brief, relevant interfaces and constraints; reviewers are independent, read-only agents. The controller owns reviews and fix dispatches.

## Review Focus

1. Literal punctuation in search must remain data and produce no SQL/query-language effects: Task 1 API assertions.
2. Non-ASCII text and emoji must obey the exact comparison and code-point boundary rules: Tasks 1 and 2 boundary assertions.
3. A late success/failure must not replace a newer request or invalidate retained results: Tasks 2 and 3 held-response assertions.
4. Restart/reset must never unexpectedly replace ordinary existing data or target a development database: Task 1 isolated lifecycle checks.
5. HTML-like fixture text must display as text without executing markup: Task 2 isolated rendering check.

## Deliverables and boundaries

| Area | Files | Responsibility |
| --- | --- | --- |
| Build and scripts | `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.gitignore`, `scripts/copy-assets.mjs` | Reproducible dependency versions, compilation and static asset copy. |
| Contracts | `app/shared/contracts.ts` | Game, patch note, list/detail/notes response and error types. |
| Data | `app/db/seed.ts`, `app/db/database.ts`, `app/db/reset.ts` | Versioned records, first initialization, preservation and dedicated test reset. |
| API | `app/api/application.ts`, `app/api/games.ts`, `app/api/server.ts` | App lifecycle, validation, GET routes and CLI startup. |
| UI | `app/ui/index.html`, `app/ui/styles.css`, `app/ui/main.ts`, `app/ui/api-client.ts`, `app/ui/catalogue.ts`, `app/ui/detail.ts` | Accessible controls, views, routing and request-state ownership. |
| Verification | `playwright.config.ts`, `tests/fixtures/app.ts`, `tests/api/games.spec.ts`, `tests/api/database.spec.ts`, `tests/e2e/catalogue.spec.ts`, `tests/e2e/detail.spec.ts`, `tests/e2e/layout.spec.ts` | Real-server API checks, isolated lifecycle checks, selected browser behaviour. |
| Presentation | `README.md`, `test-docs/first-slice-results.md` | Actual commands, tested scope, limits and recorded results. |

Ordinary run: `pnpm install`, `pnpm dev` (build then serve, no hot-reload promise). Build: `pnpm build`. Verification scripts: `pnpm typecheck`, `pnpm test:api`, `pnpm test:ui`, `pnpm test`. Record and document the commands only after execution confirms them. Default app binding: `127.0.0.1:3000`; default data path: `data/games.sqlite`; `DB_PATH` and `PORT` are explicit overrides.

Static assets must be limited to known UI files within the built UI directory. HTTP clients must not gain access to SQLite files, repository files or parent paths. Unknown API routes use the documented error envelope. The development server is not a production hosting claim.

## Versioned fixture decisions

Create exactly these ten synthetic games. Each has a fixed, nonempty fictional description committed in the seed file. Descriptions, years and platforms must be asserted against literal fixture expectations where detail checks use them; tests must not derive expected sorting through the application helper.

| ID | Title | Genre | releaseYear | platforms |
| --- | --- | --- | --- | --- |
| 1 | Orbit | Action | 2018 | Windows, Linux |
| 2 | ORBIT | RPG | 2020 | Windows |
| 3 | Écho | Puzzle | 2024 | Windows, Linux |
| 4 | Zeta | Strategy | 2022 | Windows |
| 5 | Ember Trail | Adventure | 2021 | Windows, Linux |
| 6 | Ember Quest | RPG | 2023 | Windows |
| 7 | Neon Sprint | Racing | 2019 | Windows |
| 8 | Iron Citadel | Action | 2017 | Windows, Linux |
| 9 | Moss Garden | Puzzle | 2025 | Windows |
| 10 | Atlas Tactics | Strategy | 2020 | Windows, Linux |

Literal expected catalogue IDs: `[10, 6, 5, 8, 9, 7, 1, 2, 4, 3]`. Search `Ember`: `[6, 5]`; genre `RPG`: `[6, 2]`; `Ember` + `RPG`: `[6]`; search `Orbit`: `[1, 2]`; search `ÉCH`: `[3]`; `éch` and `echo`: `[]`; `no-such-title`: `[]`.

Patch notes: IDs 1 and 2 belong to game 1 with date `2026-09-01`, versions `1.1.0` and `1.1.1`, summaries `Added a training arena.` and `Fixed training arena navigation.`; ID 3 belongs to game 1 with date `2026-08-01`, version `1.0.0`, summary `Initial release.`; ID 4 belongs to game 6 with date `2026-09-20`, version `1.2.0`, summary `Added a quest journal.` Game 1 note order: `[2, 1, 3]`. Game 9 has no notes. These are synthetic fixture statements, not claims about actual defects or game releases.

## Execution and review contract

Three sequential tasks, each with its own fresh implementer and fresh task reviewer. The reviewer returns both spec compliance and code quality verdicts. Important/critical findings return to the original implementer, followed by a fresh scoped re-review. Keep minor findings visible for the final whole-range review. Workers do not dispatch their own agents.

Maintain this plan's ignored SDD ledger and brief/report/diff artifacts. Record task base/head commits and red/green evidence. The final reviewer checks all three tasks against the existing acceptance contract, especially shared request-state and data-lifecycle boundaries.

### Task 1: Seeded database, GET API and executable foundation

**Files:** Create build/scripts/contracts/data/API files from the deliverables table, `playwright.config.ts`, `tests/fixtures/app.ts`, `tests/api/games.spec.ts`, `tests/api/database.spec.ts`, and an initial API-oriented `README.md`.

**Interfaces:**
- Produces `Game`, `PatchNote`, `GameListResponse`, `GameDetailResponse`, `PatchNotesResponse`, `ApiErrorResponse` in `app/shared/contracts.ts` with the spec's exact field names/types.
- Produces `createApplication(options: { dbPath: string; uiDir?: string }): { server: import('node:http').Server; close(): Promise<void> }` in `app/api/application.ts`. Importing it does not start listening. `close()` releases both the HTTP server and database, including on test cleanup.
- Produces `resetTestDatabase(dbPath: string): void` in `app/db/reset.ts`; the path must be absolute and beneath an explicitly owned test directory. The reset supports current tables, is transactional/idempotent and cannot target `data/games.sqlite`.
- Produces a Playwright app fixture with `baseURL`, `dbPath` and lifecycle ownership. The ordinary suite resets its dedicated database once before app startup; browser contexts remain fresh. Lifecycle/dependency checks allocate separate per-test databases.
- Serves `GET /api/games`, `GET /api/games/:id`, `GET /api/games/:id/patch-notes`. Responses and validation order are exactly those in the spec. No feedback POST endpoint in this task.

- [ ] **Step 1: Create the build/test scaffold and write failing real-server checks.** Lock resolved dependency versions; do not guess package versions. Configure the browser-independent `api` project first. Test the exact fixtures and these assertions:

```ts
expect(list.status()).toBe(200);
expect((await list.json()).games.map((game: { id: number }) => game.id))
  .toEqual([10, 6, 5, 8, 9, 7, 1, 2, 4, 3]);
expect((await combined.json()).games.map((game: { id: number }) => game.id))
  .toEqual([6]);
expect((await notes.json()).patchNotes.map((note: { id: number }) => note.id))
  .toEqual([2, 1, 3]);
expect(await noNotes.json()).toEqual({ patchNotes: [] });
```

Also assert normalized filters/total/schema, literal punctuation, ASCII/non-ASCII matching, trimmed ASCII/emoji 80/81 boundaries, strict genres, unsupported/case-mismatched/repeated keys, bare `?`, malformed IDs (`0`, `-1`, `01`, `1.5`, `abc`, `9007199254740992`), valid unknown IDs, query/path precedence and safe generic server errors. Use one isolated dependency-failure setup with a real request, documented by the implementer; do not substitute a client mock.

- [ ] **Step 2: Run `pnpm test:api` and record the expected failure.** Compilation scaffolding may precede the check, but record a behaviour failure against a minimal server, not just a missing package or typo.
- [ ] **Step 3: Implement the contracts, versioned SQLite records, validation, GET handlers, asset-serving boundary and startup.** Use parameter binding for ID lookups; search remains a literal comparison. New database startup seeds once. Existing startup preserves modified/added/deleted records. Wrap reset in a transaction and restrict its target; no normal startup reset.
- [ ] **Step 4: Add isolated database checks.** Verify exact first seed, restart preservation after changes/additions/deletions, reset to all literal seeded fields and equality after a second reset. Test rejection of an ordinary database target. Check static requests cannot return database/parent files.
- [ ] **Step 5: Run `pnpm typecheck`, `pnpm build`, `pnpm test:api`.** Expected: successful compilation and zero failing required checks. Record command/output and actual Node/pnpm/package versions. README documents only the implemented API state and reproducible commands.
- [ ] **Step 6: Self-review, commit the task, write the implementation report and undergo independent task review.** Commit subject: `feat: add seeded catalogue API and database foundation`.

### Task 2: Accessible catalogue, search/filter and request recovery

**Files:** Create `app/ui/index.html`, `app/ui/styles.css`, `app/ui/main.ts`, `app/ui/api-client.ts`, `app/ui/catalogue.ts`, `tests/e2e/catalogue.spec.ts`; extend build asset copy, `playwright.config.ts`, app fixture and README only as needed for this UI.

**Interfaces:**
- Consumes Task 1's GET list API, response types and app fixture.
- Produces `getJson<T>(url: string, signal?: AbortSignal): Promise<T>` in `api-client.ts`; non-2xx responses raise a typed `ApiRequestError` carrying `status` and parsed error `code` when available. Network failures are not converted into successful empty data.
- Produces `mountCatalogue(container: HTMLElement, options: { onOpenGame: (id: number) => void }): { destroy(): void }` in `catalogue.ts`. `destroy()` aborts/invalidates pending responses and removes view listeners.
- Produces UI bootstrap in `main.ts`; the catalogue uses real links `/#/games/<id>`. Task 3 connects these routes to detail views.

- [ ] **Step 1: Add desktop projects and write failing catalogue checks.** Use Chromium, Firefox and WebKit at `1280 x 800`, API checks in the single `api` project, serial workers and report/trace configuration. Test initial seeded cards/count, `Ember`, `RPG`, their combination, clearing either control, no results, and visible loading while the response is held.
- [ ] **Step 2: Run the catalogue spec in Chromium and record the expected behaviour failure.** Do not spend all three browser runs on each intermediate edit.
- [ ] **Step 3: Implement the catalogue and readable responsive CSS.** Accessible controls are named `Search games` and `Genre`; the genre select has `All genres` plus the six fixed spec values. Use exact copy `No games found` and `Search must be 80 characters or fewer`. Show results/count and identify the valid control values that produced retained results. A latest failure shows a distinct error and `Retry`.
- [ ] **Step 4: Write and implement request/validation tests.** Check 80/81 ASCII and emoji boundaries with surrounding spaces; invalid input makes no request, blocks genre/Retry requests, retains prior results/count/labels and removes validation when corrected. Hold two valid requests and release in reverse order: late success or failure cannot replace the latest results or loading/empty/error state. Invalidate before the first request completes: the old response cannot populate results. For HTTP `500` and network abort, restore real responses and verify current-control Retry recovery.
- [ ] **Step 5: Verify text rendering and catalogue keyboard/focus.** In an isolated database, replace a title with HTML-like text; assert it is displayed literally with no injected element/script. Operate search, genre, game links and Retry by keyboard with visible focus and useful status/validation associations.
- [ ] **Step 6: Run `pnpm typecheck`, `pnpm test:api` and the catalogue spec in all three desktop projects.** Expected: zero required failures. Update README with actual UI startup and selected test commands; detail routes remain explicitly pending.
- [ ] **Step 7: Self-review, commit, write the report and undergo independent task review.** Commit subject: `feat: add catalogue search filters and recovery states`.

### Task 3: Details, patch notes and first-slice handoff

**Files:** Create `app/ui/detail.ts`, `tests/e2e/detail.spec.ts`, `tests/e2e/layout.spec.ts`, `test-docs/first-slice-results.md`; extend `main.ts`, CSS, app fixture/config as needed, and finish README.

**Interfaces:**
- Consumes `getJson<T>`, `ApiRequestError`, `mountCatalogue`, shared response types, GET detail/notes API and app fixture.
- Produces `mountDetail(container: HTMLElement, gameId: number, options: { onBack: () => void }): { destroy(): void }` in `detail.ts`.
- `main.ts` owns hash routing, exactly one mounted view, `hashchange` subscriptions and cleanup on navigation. Direct valid detail URLs work; returning to the catalogue cannot resurrect a pending detail or notes request.

- [ ] **Step 1: Write failing detail/navigation checks and run the focused Chromium spec.** Open Orbit, assert title, genre, fixed description, release year and platforms from literal fixture expectations; assert Back returns to catalogue. Follow `Patch notes` and assert `[2, 1, 3]` order and literal text. Game 9 shows an explicit empty-notes message. Check direct `/#/games/1` entry.
- [ ] **Step 2: Implement detail routing and independently loaded notes.** Detail and notes have separate loading/error state. Preserve successful details during a notes failure. Use exact transient copy `Could not load game details` and `Could not load patch notes`; unknown game copy is `Game not found`. Transient failures offer current-game Retry; `404` offers Back and no Retry.
- [ ] **Step 3: Write and implement focused recovery/concurrency checks.** Hold/fail detail and notes requests separately; test HTTP `500`, network abort, successful Retry and `404`. Navigate A to B and Back before A completes; old detail/notes successes and failures cannot overwrite current content. Notes Retry can recover to ordered notes or the valid empty array.
- [ ] **Step 4: Complete layout and keyboard checks for this slice.** Test catalogue/search/filter/detail/notes at `1280 x 800` desktop and `375 x 812` Chromium phone, including long text, loading and errors; no horizontal page overflow. Keyboard reaches game links, Back, Patch notes and both Retry actions with visible focus. Do not claim the missing feedback/favourites parts of the broader inventory entry complete.
- [ ] **Step 5: Run `pnpm typecheck`, `pnpm build`, `pnpm test`.** Verify fresh owned databases and all required first-slice projects. Record actual pass/fail counts, versions and environment. Browser download failures are blocked coverage, not passed tests.
- [ ] **Step 6: Finish README and results with actual evidence.** Document clean-checkout install/build/run/tests, synthetic fixtures and partial coverage by existing IDs. Explicitly list unimplemented favourites, feedback, full data lifecycle, axe/manual screen-reader review, CI and external hosting. Record genuine manual observations separately from automated results; never invent bug counts or investigations. Existing planned procedures and global completion gates remain intact.
- [ ] **Step 7: Self-review, commit, write the report and undergo independent task review.** Commit subject: `feat: add game details patch notes and first-slice verification`.

## Final gate

- [ ] A fresh reviewer checks the complete Task 1..3 commit range, requirements, quality and cross-component consistency; deferred minor findings are supplied.
- [ ] Relevant fixes return to an implementer and undergo scoped re-review. No controller-only unreviewed code fixes.
- [ ] The coordinator confirms required check evidence, clean worktree and the recorded limitations before stating completion.
- [ ] Report the completed milestone, commit list and exact remaining coverage; do not call the full QA portfolio finished.

## Plan self-review record

The selected catalogue/detail/GET contract has an owning task; feedback/favourites portions are explicitly deferred. API types/lifecycle are produced in Task 1, request client/catalogue in Task 2, detail consumes both in Task 3. All three tasks own independently testable behaviour. The five review-focus items have assigned checks. No required broader inventory count is used as a misleading first-slice pass count. Work on `main` and SDD were selected by the user; dependency installation and implementation remain pending review of this plan.
