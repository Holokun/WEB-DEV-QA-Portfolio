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
6. Two or three genuine, reproducible bug investigations with supporting evidence. Do not invent defects or claim a known seeded defect was discovered independently.

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
- Seed 8–12 varied games and several patch notes, including titles and genres that make search and filter results unambiguous.
- Give every element used by a test a user-facing label or role. Use test IDs only where accessible locators are ambiguous.
- Keep test data deterministic: seed a dedicated test database; create unique feedback records per test; clear local storage before tests that need a fresh favourites state.

## Build phases and completion gates

### 1. Requirements and QA design

Create `test-docs/requirements.md`, `test-plan.md`, `test-scenarios.md`, and `traceability-matrix.md`. Assign requirement IDs such as `CAT-01`, `FAV-01`, and `FBK-01`. Prioritize risks: incorrect search/filter combinations, lost favourites, invalid feedback accepted, broken mobile controls, and API failures hidden by the UI.

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

## Proposed automated test inventory (20 cases)

| ID | Area | Assertion | Priority |
| --- | --- | --- | --- |
| UI-01 | Catalogue | Seeded games render with title and genre | Smoke |
| UI-02 | Search | Exact/partial title search returns the expected game | Smoke |
| UI-03 | Filter | Genre filter returns only matching games | Regression |
| UI-04 | Search + filter | Combined controls narrow results correctly | Regression |
| UI-05 | Empty state | Unmatched search explains that no games were found | Regression |
| UI-06 | Detail | Opening a result shows the correct details and patch notes | Smoke |
| UI-07 | Favourites | Add then remove a game; count/list update | Smoke |
| UI-08 | Favourites | Selection survives page reload | Regression |
| UI-09 | Feedback | Required fields reject empty submission | Regression |
| UI-10 | Feedback | Invalid email or too-short description shows useful errors | Regression |
| UI-11 | Feedback | Valid submission shows confirmation and is stored | Smoke |
| UI-12 | Keyboard | Catalogue, favourite button, and form can be operated by keyboard | Regression |
| UI-13 | Mobile | At a phone viewport, search/filter and detail content remain usable without horizontal overflow | Regression |
| UI-14 | Error handling | A controlled `500` catalogue response shows a useful retryable error state | Regression |
| A11Y-01 | Accessibility | Catalogue has no critical/serious axe violations | Regression |
| A11Y-02 | Accessibility | Detail and feedback views have no critical/serious axe violations | Regression |
| API-01 | API | Games list and detail return expected status/body/schema | Regression |
| API-02 | API | Invalid query and missing game return contract-compliant `400`/`404` bodies | Regression |
| API-03 | API + database | Valid feedback returns `201` and the inserted row matches a SQL verification query | Regression |
| API-04 | API error handling | An isolated server dependency failure returns a safe, contract-compliant `500` body | Regression |

Use a controlled failure in the test environment for UI-14 and API-04; document the failure mechanism so the check is reproducible. Keep visual regression to one or two stable screenshots after the core 20 are reliable; use fixed data, viewport, browser, and fonts. This avoids making screenshot baselines the main QA story.

### Browser coverage

- Run all smoke UI tests in Chromium, Firefox, and WebKit.
- Run the full UI regression in all three browsers in CI; keep API/database checks in one project because they are browser-independent.
- Run the mobile check in at least Chromium with a documented phone viewport; add WebKit mobile coverage if stable in CI.
- Treat axe results as a useful automated screen, and include a manual keyboard/focus review because axe does not cover every accessibility issue.

## Evidence and bug-report standard

For each investigated defect, save a short report in `bug-reports/` with: ID/title, build and browser, severity and priority, preconditions, reproduction steps, expected/actual behavior, frequency, and status. Link an evidence item showing the failure. For one or more reports, include the relevant network request/response and HTTP status, console output, and DOM/CSS observation where applicable. Label speculation as a root-cause hypothesis until confirmed by code or a fix.

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
│   ├── requirements.md
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
3. Perform the manual and exploratory pass; write genuine bug records.
4. Automate the five smoke cases, then the remaining regression cases.
5. Add browser, mobile, accessibility, SQL, and optional visual coverage.
6. Configure CI, review flaky tests, and publish a truthful final test summary.

The first implementation milestone is a documented, runnable catalogue with search/filter, a game detail view, and seeded API data. That provides a useful test subject before the rest of the features are built.
