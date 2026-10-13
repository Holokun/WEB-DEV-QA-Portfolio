# Favourites and Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development task by task. Implementers have fresh context; the controller assigns a separate reviewer after each task and a whole-change review at the end.

**Goal:** Complete the approved minimum application's favourites and feedback features with verified persistence, validation, recovery and SQLite lifecycle behavior.

**Architecture:** Extend the existing vanilla TypeScript views and Node HTTP API. Favourites use a shared localStorage-backed model; feedback uses one pure validation module shared by UI/API and an SQLite table. Keep the existing catalogue/detail request ownership and the serial suite-owned app/database contract.

**Tech Stack:** TypeScript, Node >=24.19.0, node:sqlite, Playwright 1.63.0; no new product dependencies or subscriptions.

**Spec:** `PROJECT_PLAN.md` and `test-docs/requirements-and-risks.md`, previously approved by the user; `test-docs/test-plan.md`, `test-docs/test-scenarios.md` and `test-docs/traceability-matrix.md` define verification scope. Existing IDs stay stable.

## Global Constraints

- Work in the existing main checkout at `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio`, per the user's earlier explicit preference. Preserve unrelated local changes. Controller owns commits; workers do not stage/commit/push.
- One implementer at a time. After its report, a fresh reviewer checks specification and quality; fixes return to that implementer and receive a fresh scoped review.
- Use fixed fixture v1 games/notes unchanged. Each run owns an absolute DB_PATH and available port; mutation/lifecycle/failure tests own isolated databases/apps. Never reset the human session/development database.
- Run app/database tests serially with workers:1. Ordinary feedback tests share the suite DB, check counts and returned IDs, and never assume ID 1. Exact boundary descriptions receive no uniqueness suffix.
- Favourites: REQ-FAV-01/02, immediate state/list/count; malformed JSON/non-array become empty, remove invalid/duplicate IDs, defer obsolete-ID cleanup until a complete unfiltered catalogue succeeds. Filtered/failed requests do not purge saved selections.
- Feedback: REQ-FBK-01/02/03, REQ-API-07/05/06. Required game/email/description; strict JSON field types/keys; trim email/description; email uses EMAIL-01–27; description minimum 20 Unicode code points.
- Feedback validation order: reject query keys, parse/validate every body field, look up game, then insert. Errors use existing generic API shape/codes; no error inserts. Success is 201 `{ id }` with one matching row.
- Startup preserves existing games/notes/feedback/counter. Add missing feedback schema without reseeding old databases. Reset is transactional, clears feedback/counter and restores seed; an isolated pre-commit failure rolls everything back.
- Existing catalogue/detail behavior and meaningful tests remain. Use semantic labels, visible focus, live validation/status, desktop 1280×800 and Chromium phone 375×812; do not claim screen-reader/axe/CI completion.

## Decisions and interfaces

- Routes: `/#/favourites`, `/#/feedback`, current catalogue `/` and detail `/#/games/<id>`. A header nav exposes Library, Favourites and then Feedback. Existing render focus on main remains; header favourites count is live text without adding a second role=status to catalogue.
- Storage key: `game-companion:favourites`, JSON array of positive safe integer IDs. Storage read/write failures must leave the page usable and expose a useful persistence warning; do not crash or silently claim a failed save.
- `createFavouritesStore(storage?: Storage)` in `app/ui/favourites.ts`: `ids(): readonly number[]`, `has(id): boolean`, `toggle(id): void`, `validate(games: readonly Game[]): void`, `subscribe(listener): () => void`. Keep persistence warning available to the views. Validation is called only with a successful complete catalogue.
- `createFavouriteButton(game, store): HTMLButtonElement` and `updateFavouriteButton(button, game, store): void` in `app/ui/favourite-button.ts`. Names: `Add <title> to favourites` / `Remove <title> from favourites`; aria-pressed tracks membership. Views own subscription cleanup; detached buttons must not leave model subscriptions behind.
- `mountFavourites(container, { store, onOpenGame }): { destroy(): void }` owns complete-catalogue loading/error/Retry and the saved-game list. Count reflects retained candidate IDs while complete loading fails.
- Catalogue/detail options receive the same store. Only successful catalogue responses with empty search and genre validate it. Direct favourites loads its own complete catalogue; no extra parallel validation fetch is added to ordinary catalogue startup.
- Shared `FeedbackInput { gameId: number; email: string; description: string }`, `FeedbackResponse { id: number }`; pure `validateFeedback(value: unknown)` returns `{ valid:true, value:FeedbackInput }` or `{ valid:false, errors: { gameId?:string; email?:string; description?:string; body?:string } }`.
- Feedback table: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `game_id INTEGER NOT NULL REFERENCES games(id)`, `email TEXT NOT NULL`, `description TEXT NOT NULL`. SQL column names are stable for verification.
- UI `mountFeedback(container, { onBack, store }): { destroy(): void }`: complete catalogue selects known games, blank initial game option, labelled email/description fields and Submit feedback button. `novalidate` permits the shared exact rules, with field-level aria-invalid/aria-describedby/live messages. Pending submission prevents duplicates; network/500 errors preserve input. Success confirms accepted submission; retaining values after success is acceptable.
- `postJson<T>(url, body, signal?)` extends existing API client. A destroyed feedback view aborts its request and ignores stale results; a request accepted before navigation may still have stored feedback.
- Shared browser validation import uses `/shared/feedback-validation.js`; copy the compiled pure module into the UI asset directory and explicitly allow that URL. New view modules get explicit static allowlist entries; do not weaken the current path boundary.
- `resetTestDatabase(dbPath, options?: { beforeCommit?: () => void }): void` provides a test-reset-only rollback hook. Normal application/API do not expose it.

## Review Focus

1. Old databases: adding feedback schema must preserve deleted/changed/extra games, notes, feedback and ID counter; Task 1 migration/restart/reset tests.
2. Saved IDs hidden by filters or catalogue failure: no obsolete-ID purge until complete success; Task 2 storage/integration tests.
3. Native email validation disagrees with the contract: share validator, novalidate, all 27 named cases in both HTTP and UI; Tasks 1/3.
4. Navigation or repeated submit during pending requests: one insert per accepted action and no stale view update; Task 3 failure/pending/navigation tests.
5. Additional controls break focus/layout or teardown: keyboard and phone paths plus current-suite regression; Task 4 integration tests and final run.

## Task 1: Feedback API, shared validation and database lifecycle

**Files:** create `app/shared/feedback-validation.ts`, `app/api/feedback.ts`, `tests/api/feedback.spec.ts`, `tests/fixtures/feedback-data.ts`; modify `app/shared/contracts.ts`, `app/api/application.ts`, `app/db/database.ts`, `app/db/reset.ts`, `tests/api/database.spec.ts`, `scripts/copy-assets.mjs`; extend only the ApiResult type import/body union in `app/api/games.ts` for FeedbackResponse.

**Consumes:** `apiError`, `ApiResult`, `openDatabase`, `createSchema`, `insertSeed`, ownedDatabase/startApp helpers and existing fixture values.
**Produces:** shared validation/types, actual POST endpoint/schema/reset behavior, literal email fixtures for Task 3 and served browser validation module.

- [ ] Write HTTP/SQL failing tests first: valid synthetic submission returns 201 and exactly one trimmed row selected by returned ID; every EMAIL-01–27 value and fixed description boundaries; malformed JSON/missing/extra/wrong-type/body/query/unknown game precedence; no insertion for errors. Verify generic isolated dependency failure.
- [ ] Add lifecycle tests: old games/notes-only database gets feedback table without data restoration; new path empty feedback; restart preserves feedback/counter; reset clears rows and next insert ID is 1; repeat reset equality; pre-commit failure preserves all rows/counter.
- [ ] Run new focused tests against the baseline and record expected RED before product code.
- [ ] Implement pure validation and strict POST handling, parameterized insertion and non-destructive schema creation. Keep API errors generic and handle async request failures without double sends. Do not introduce an unspecified description maximum.
- [ ] Extend safe test reset in one transaction, with callback only at the reset boundary; preserve ownership guard.
- [ ] Copy/allowlist pure browser validator and run `pnpm build`, `pnpm exec playwright test tests/api/feedback.spec.ts tests/api/database.spec.ts --project=api`; include relevant existing games API checks if routing changed. Record GREEN and self-review.
- [ ] Controller review, fix loop if needed, then commit only this task's assigned changes.

## Task 2: Favourites model and views

**Files:** create `app/ui/favourites.ts`, `app/ui/favourite-button.ts`, `app/ui/favourites-view.ts`, `tests/e2e/favourites.spec.ts`; modify `app/ui/catalogue.ts`, `app/ui/detail.ts`, `app/ui/main.ts`, `app/ui/index.html`, `app/ui/styles.css`, `app/api/application.ts` only for asset entries. A narrow additive reverse-focus assertion in `tests/e2e/layout.spec.ts` accounts for the detail favourite control; retain notes/Back assertions. The direct cleanup probe in `tests/e2e/catalogue.spec.ts` supplies the now-required shared store and verifies subscription cleanup without weakening existing destroy/request assertions.

**Consumes:** existing Game contracts/API, current view ownership, shared model interface above.
**Produces:** working saved favourites on catalogue/detail/favourites route, immediate count/list/button states and complete-only validation.

- [ ] Add failing TEST-UI-07/08 browser tests: add/remove from cards/detail/list, reload; malformed/non-array/invalid/duplicate IDs; hidden-by-filter retention; failed complete and filtered requests preserve candidate IDs, later complete success removes obsolete IDs. Use isolated app for catalogue mutations; do not reset suite DB. Include localStorage access/write failure usability.
- [ ] Run the new focused Chromium tests and record RED before implementation.
- [ ] Implement model, accessible shared buttons, list/loading/error/Retry, header count/nav and routing. Preserve current catalogue/result ownership and normal number of catalogue requests.
- [ ] Keep subscriptions/destroy cleanup, literal text rendering, screen widths and visible focus. No favourites server endpoint or account system.
- [ ] Run `pnpm build` and focused favourites tests; run existing catalogue/detail/layout checks when changed behavior warrants it. Record GREEN and self-review.
- [ ] Controller review/fix/re-review, then task commit. Task 3 may add Feedback header link after this task.

## Task 3: Feedback form and persistence checks

**Files:** create `app/ui/feedback.ts`, `tests/e2e/feedback.spec.ts`; modify `app/ui/api-client.ts`, `app/ui/main.ts`, `app/ui/index.html`, `app/ui/styles.css`, `app/api/application.ts` only for feedback asset entries.

**Consumes:** Task 1 validator/types/endpoint/fixtures, Task 2 store and header/routing.
**Produces:** required-field validation, exact email/description rules, successful HTTP/SQL-backed submission and value-preserving recovery.

- [ ] Write failing TEST-UI-09/10/11 checks: empty submit identifies all fields and sends no request; every named email example; 19/20 ASCII and 19/20 emoji, whitespace/trim; accepted requests add exactly one row and match its returned ID; rejected UI requests do not insert.
- [ ] Add controlled network and HTTP 500 submit failures (separate from the historical catalogue simulation), verify preserved game/email/description and retry success. Double-submit pending action sends one request. Navigation prevents a late response changing the current view. Label controlled conditions accurately.
- [ ] Record focused Chromium RED before implementing the form.
- [ ] Implement form and postJson with accessible validation/status, complete game list, shared model validation only after complete success, no native-validator conflicts and deterministic destroy cleanup.
- [ ] Run `pnpm build` and focused feedback UI tests; record GREEN, self-review and hand off.
- [ ] Controller review/fix/re-review, then task commit.

## Task 4: Integration coverage, evidence and portfolio documentation

**Files:** modify `tests/e2e/layout.spec.ts`, `README.md`, `test-docs/test-plan.md`, `test-docs/traceability-matrix.md`; narrowly rename the primary successful submission in `tests/api/feedback.spec.ts` to its existing inventory ID TEST-API-03. Create `sql/verification-queries.sql`, `test-docs/favourites-feedback-results.md`, `bug-reports/BUG-FAV-01-memory-navigation.md`, `bug-reports/BUG-API-01-unsafe-feedback-id.md`, with dated native evidence. Preserve historical reports and future gates.

**Consumes:** all three reviewed implementations and their recorded tests.
**Produces:** required successful keyboard paths, desktop/phone feature layout checks, fresh regression evidence and clear run/SQL documentation.

- [ ] Add meaningful keyboard paths for add/remove/list and feedback entry/submission, plus feedback layout at desktop and phone. Account for existing render focus and actual nav order; do not weaken existing assertions to hide regressions. Retain browser-independent SQL row checks in UI successes.
- [ ] Run fresh build/typecheck and full existing+new suite in Chromium, Firefox, WebKit and required Chromium-phone configuration. Record distinct definitions vs variants vs browser executions; retain native JSON/HTML/failure evidence. Investigate actual failures rather than reducing the browser matrix.
- [ ] Capture/inspect representative normal/validation/favourites/feedback desktop and phone screenshots. Keep Playwright browsers separate from Vadim's ordinary Firefox session.
- [ ] Add SQL queries for catalogue/notes and feedback verification by returned ID, counts and sqlite_sequence. Document actual storage key, routes, migration/reset and commands. Keep screen-reader/axe/CI and deployment/apply-to-Larian work pending.
- [ ] Task review/fixes, whole-change final review, focused fix re-review if needed, then verified task commit. No automatic push, merge or TestRail result publication.

## Controller preflight and progress

Existing main worktree contains prior authorized reports/cache repair and unrelated local assets. The plan adds no paid tools, authentication or external side effects. Task dependencies are sequential: 1 → 2 → 3 → 4. `application.ts`, `main.ts`, `index.html` and CSS are shared sequentially; workers own only their assigned edits. The ledger and per-task reports live under the already ignored `test-results/sdd/favourites-feedback-2026-10-12/`, outside runner artifact cleanup.

Previously approved project documents are the binding design; this plan makes implementation choices within that scope. Continue with the user's preserved subagent execution choice and main-branch preference.
