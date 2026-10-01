# Game Companion Web Application — QA Portfolio Project Plan

## Goal

Build a small game companion application and use it to demonstrate a complete, credible QA workflow: requirements analysis, risk-based test design, exploratory testing, bug investigation, UI/API/accessibility automation, database verification, and CI reporting.

The portfolio's main product is the QA work. Keep the application deliberately small enough that its behavior and every automated test can be explained in an interview.

## What a reviewer should see in five minutes

1. A README that explains the app, the QA approach, and how to run the smoke and full suites.
2. A short test plan with risks, scope, environments, and exit criteria.
3. A traceability matrix linking requirements to manual scenarios, automated tests, and bugs.
4. About 20 meaningful automated test cases with readable names and stable data.
5. A CI run with a Playwright HTML report, traces/screenshots for failures, and a concise test summary.
6. Aim for two or three reproducible investigations with supporting evidence. Document genuine defects when found; otherwise use clearly labelled failure-simulation investigations. Report the actual number of defects found honestly. Do not invent defects or claim a known seeded defect was discovered independently.

## Scope and architecture

### Application behavior

| Area | Minimum behavior | Data source |
| --- | --- | --- |
| Catalogue | Show games and empty/loading/error states | `GET /api/games` |
| Search and genre filter | Combine search and genre; display a clear no-results state | `GET /api/games?search=&genre=` |
| Game details | Open a game, show description and patch-note links | `GET /api/games/:id` |
| Patch notes | Show notes for a game in newest-first order | `GET /api/games/:id/patch-notes` |
| Favourites | Add/remove games and keep choices after reload | Browser local storage |
| Feedback | Validate required fields and submit a bug report | `POST /api/feedback` |
| Layout | Work at desktop and mobile widths | Responsive CSS |

Use TypeScript for the Node.js API, frontend, and tests; SQLite for games, patch notes, and submitted feedback; Playwright for browser and API tests; `@axe-core/playwright` for automated accessibility checks. Keep authentication, accounts, administration, and third-party integrations out of the first version.

### Key decisions to document before coding

- Write explicit acceptance criteria for search matching, combined filters, no-results behavior, favourites persistence, feedback validation, and API errors.
- Define a small API contract, including status codes, response shapes, and invalid-parameter behavior. For example: `200` for a valid list/detail, `400` for an invalid query, `404` for an unknown game, and `201` for accepted feedback.
- Seed 8–12 varied games and several patch notes, including titles and genres that make search and filter results unambiguous. Include non-ASCII titles, distinct games with equal ASCII-folded title keys, equal-date notes for the same game, and a game without notes; follow the [fixture prerequisites](test-docs/requirements-and-risks.md#seed-fixture-prerequisites).
- Give every element used by a test a user-facing label or role. Use HTML `data-testid` attributes only where accessible locators are ambiguous; these attributes are separate from the `TEST-` IDs used in the test inventory.
- Keep test data deterministic: run app/database-dependent tests serially against one owned app per suite invocation and one explicit `DB_PATH`. Reset that database before ordinary suite tests. Checks that mutate catalogue/patch notes, verify database startup or reset, or fail a server dependency use a separate per-test database and app, with setup and extra resets as specified in the [reset rules](test-docs/requirements-and-risks.md#database-initialization-and-test-reset). Ordinary feedback submissions use the suite database and unique values per test; clear local storage before tests that need a fresh favourites state.

## Build phases and completion gates

### 1. Requirements and QA design

Maintain `test-docs/requirements-and-risks.md` and create `test-docs/test-plan.md`, `test-docs/test-scenarios.md`, and `test-docs/traceability-matrix.md`. Use `REQ-` for requirement IDs (for example, `REQ-CAT-01`, `REQ-FAV-01`, and `REQ-FBK-01`) and `TEST-` for automated test IDs. A traceability row can link `REQ-API-03` (detail endpoint) to `TEST-API-01` (list/detail check); `TEST-API-03` identifies the separate feedback/database check. Use `SCN-` for manual scenarios, `BUG-` for genuine defect records, and `SIM-` for failure-simulation investigations. Prioritize risks: incorrect search/filter combinations, lost favourites, invalid feedback accepted, broken mobile controls, and API failures hidden by the UI.

Use the [chat task plan](test-docs/chat-task-plan.md) for document ownership, dependencies, handoffs, and copy-ready task prompts. The [test plan](test-docs/test-plan.md) defines execution scope and gates; the [manual scenarios](test-docs/test-scenarios.md) define procedures and expected results. These documents describe planned work and do not establish that testing has been executed.

**Done when:** Each feature has observable acceptance criteria; high-risk criteria have planned tests; the test plan states browser/viewport coverage, test data, entry/exit criteria, and known exclusions.

### 2. Minimal test subject

Build the catalogue, detail/patch-note pages, favourites, feedback form, API, database schema, and seed script. Add basic loading, empty, and error messages. Use semantic HTML and responsive layouts from the start.

**Done when:** A reviewer can start the app with one documented command, browse the seeded data on desktop and mobile, and submit feedback; API behavior matches the written contract.

### 3. Manual and exploratory testing

Execute a small manual checklist before automation. Write an exploratory charter for one focused session, such as searching and filtering under slow or failing network conditions. Record observations, environment, exact reproduction steps, expected/actual results, severity, and evidence for real defects.

**Done when:** The exploratory notes show what was tried and what was learned; at least one investigation connects browser Network/Console or DOM/CSS observations to a reasoned root-cause hypothesis. If no genuine defect is found, report that honestly and document an investigated failure simulation as such.

### 4. Automated checks

Implement the test inventory below. Start with a small smoke set, then add API, accessibility, mobile, and database checks. Prefer independent tests with precise assertions over long end-to-end scripts. Avoid fixed sleeps.

**Done when:** Roughly 20 tests pass locally; smoke tests are reliable across Chromium, Firefox, and WebKit; failed runs retain a trace and screenshot; the full suite can run from a clean seeded test database.

### 5. CI and portfolio presentation

Run smoke checks on every push. Run the full regression suite on pull requests and pushes to the default branch; optionally schedule a nightly run. Upload the Playwright HTML report and failure artifacts. Complete the summary report and README with a coverage map, commands, sample results, limitations, and links to evidence.

**Done when:** A fresh checkout can follow the README and reproduce the results; the repository has a visible successful CI run; every claim in the summary links to a test, report, query, or bug record.

## Proposed automated test inventory (21 cases)

| ID | Area | Assertion | Priority |
| --- | --- | --- | --- |
| TEST-UI-01 | Catalogue | Seeded games render with title and genre | Smoke |
| TEST-UI-02 | Search | Exact/partial search follows the ASCII case rule; 80 code points are accepted, and 81 show field validation without a request, preserve previous results, block requests from genre changes and Retry, and recover using the current controls after correction | Smoke |
| TEST-UI-03 | Filter | Genre filter returns only matching games when search is valid | Regression |
| TEST-UI-04 | Search + filter | Combined controls narrow results correctly; clearing either control preserves the other restriction; an invalid search defers genre updates until correction. Overlapping valid search/filter requests completed in reverse order preserve the latest controls' results, count, and loading/empty/error states; older successes or failures cannot overwrite them | Regression |
| TEST-UI-05 | Empty state | Unmatched search explains that no games were found | Regression |
| TEST-UI-06 | Detail | Opening a result shows correct details and ordered patch notes; a game without notes shows an explicit empty message. Regression variants cover separate detail/notes loading, HTTP `500`/network errors and Retry, unknown-game `404`, and navigation while an older request is pending | Smoke |
| TEST-UI-07 | Favourites | Add then remove a game; count/list update | Smoke |
| TEST-UI-08 | Favourites | Selection survives reload; malformed/wrong-shape storage recovers to empty; complete unfiltered catalogue validation removes obsolete IDs, retains games hidden by filters, and removes invalid/duplicate IDs; failed catalogue requests preserve saved selections until validation succeeds | Regression |
| TEST-UI-09 | Feedback | Required fields reject empty submission | Regression |
| TEST-UI-10 | Feedback | Every named email variant and description length boundary in the requirements follows the same UI/API validation rule and shows useful field errors | Regression |
| TEST-UI-11 | Feedback | Valid submission confirms and is stored; server/network failure shows an error and preserves all entered values | Smoke |
| TEST-UI-12 | Keyboard | Catalogue, favourite button, and form can be operated by keyboard | Regression |
| TEST-UI-13 | Responsive layout | Desktop variant: 1280 px viewport width. Phone variant: 375 px viewport width. In each variant, search, filter, catalogue cards, detail content, and feedback controls remain usable without horizontal overflow | Regression |
| TEST-UI-14 | Error handling | Controlled `500` and network failures show an error distinct from empty results; with valid search, restore the response and click Retry to load the current search/genre and clear the error; with invalid search, Retry sends no request and correction resumes requests using the latest genre | Regression |
| TEST-A11Y-01 | Accessibility | Catalogue has no critical/serious axe violations | Regression |
| TEST-A11Y-02 | Accessibility | Detail and feedback views have no critical/serious axe violations | Regression |
| TEST-API-01 | API | List/detail/notes return expected status/body/schema; assert ASCII/non-ASCII search and title ordering, equal-date note ID ordering, and `{ patchNotes: [] }` for a known game without notes | Regression |
| TEST-API-02 | API | Endpoint-specific query rules, query boundaries, malformed IDs, invalid feedback fields/types, and unknown games return contract-compliant `400`/`404` bodies without insertion. Every named email variant is checked: accepted values return `201` and store trimmed email; rejected values return `400 INVALID_BODY` without insertion | Regression |
| TEST-API-03 | API + database | Valid feedback returns `201` and the inserted row matches a SQL verification query | Regression |
| TEST-API-04 | API error handling | An isolated server dependency failure returns a safe, contract-compliant `500` body | Regression |
| TEST-DATA-01 | Database startup and reset | Isolated variants: first startup at a nonexistent database path creates the exact seeded games/notes with no feedback; restart preserves record changes, additions, and deletions, plus feedback and counter state; reset restores every seeded field/ID, clears feedback, and makes the next feedback ID `1`; repeat reset for equality and inject a pre-commit failure to verify records/counter roll back unchanged | Regression |

Use a controlled failure in the test environment for TEST-UI-14 and TEST-API-04; document the failure mechanism so the check is reproducible. Use data-driven variants for the accepted/rejected examples and boundaries in `test-docs/requirements-and-risks.md`; the executed test count may exceed the 21 inventory entries. Keep visual regression to one or two stable screenshots after the core checks are reliable; use fixed data, viewport, browser, and fonts. This avoids making screenshot baselines the main QA story.

For entries marked Smoke, run the primary successful path in the smoke suite; their validation, empty-state, and failure variants belong to regression. `test-docs/traceability-matrix.md` assigns each requirement and the additional variants to an inventory entry. These are planned checks; record execution evidence separately when implemented.

### Browser coverage

- Run all smoke UI tests at the 1280 x 800 desktop viewport in Chromium, Firefox, and WebKit.
- Run the full desktop UI regression, including keyboard and axe checks, in all three browsers in CI. This three-browser requirement applies to desktop; keep API/database checks in one project because they are browser-independent.
- Run the 375 x 812 phone variant of TEST-UI-13 in Chromium in full regression. This is a responsive viewport check, not the full UI suite on mobile or a real-device certification. WebKit phone coverage is optional; record whether it ran. Firefox phone coverage is outside the required scope.
- Treat axe results as a useful automated screen, and include a manual keyboard/focus review because axe does not cover every accessibility issue.

## Evidence and bug-report standard

For each investigated defect, save a short report in `bug-reports/` with: ID/title, build and browser, severity and priority, preconditions, reproduction steps, expected/actual behavior, frequency, and status. Link an evidence item showing the failure. For one or more reports, include the relevant network request/response and HTTP status, console output, and DOM/CSS observation where applicable. Label speculation as a root-cause hypothesis until confirmed by code or a fix.

For a failure simulation, use a `SIM-` ID and clearly label the report as a simulation. Record the injected failure, why it was chosen, the observed response, and supporting evidence. Count simulations separately from genuine defects in the summary report. Completion does not require a minimum number of genuine defects.

Keep reports and traces out of version control if they contain personal data. Use synthetic feedback content. Commit a few small, representative evidence files and let CI retain full run artifacts.

## Suggested repository structure

```text
game-companion-qa/
├── README.md
├── PROJECT_PLAN.md
├── app/                       # UI, API, SQLite schema, seed data
├── tests/
│   ├── e2e/
│   ├── api/
│   ├── accessibility/
│   ├── visual/
│   └── fixtures/
├── test-docs/
│   ├── requirements-and-risks.md
│   ├── test-plan.md
│   ├── test-scenarios.md
│   ├── exploratory-charter.md
│   ├── traceability-matrix.md
│   └── test-summary-report.md
├── bug-reports/
├── sql/verification-queries.sql
├── evidence/
├── playwright.config.ts
└── .github/workflows/tests.yml
```

## Recommended working order

1. Write requirements, risk list, and first traceability rows.
2. Build the smallest usable app and deterministic database seed.
3. Perform the manual and exploratory pass; document genuine defects when found and clearly label any failure-simulation investigations.
4. Automate the five smoke cases, then the remaining regression cases.
5. Add browser, mobile, accessibility, SQL, and optional visual coverage.
6. Configure CI, review flaky tests, and publish a truthful final test summary.

The first implementation milestone is a documented, runnable catalogue with search/filter, a game detail view, and seeded API data. That provides a useful test subject before the rest of the features are built.
