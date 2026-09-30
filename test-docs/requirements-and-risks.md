# Game Companion — Acceptance Criteria and Risk List

Source: [`PROJECT_PLAN.md`](../PROJECT_PLAN.md). These criteria define observable behavior for the planned first version. Requirement IDs begin with `REQ-`; automated test IDs in the plan begin with `TEST-`. Traceability records link these distinct IDs rather than using one ID for both a requirement and a test. For example, `REQ-API-03` defines the detail endpoint and `TEST-API-01` checks list/detail responses.

## Acceptance criteria

| ID | Area | Criterion |
| --- | --- | --- |
| REQ-CAT-01 | Catalogue | On load, the page requests `GET /api/games`, shows a loading state while waiting, then displays every returned game with its title and genre. |
| REQ-CAT-02 | Search | Search matches a case-insensitive, trimmed substring of a game title. Clearing search removes only the search restriction; if a genre is selected, results still show only that genre. |
| REQ-CAT-03 | Genre filter | Selecting a genre shows only games in that genre. Clearing the genre removes only the genre restriction; any search text still limits the results. |
| REQ-CAT-04 | Combined controls | Search and genre apply together with AND logic. Changing either control updates the results and their count without requiring a page reload. |
| REQ-CAT-05 | No results | A valid search/filter combination with zero matches displays “No games found” and a way to clear the controls. It does not show a blank page. |
| REQ-CAT-06 | Load failure | A failed catalogue request displays a distinct error message and a Retry action. The UI never presents an API failure as “No games found.” |
| REQ-DET-01 | Game detail | Opening a catalogue game shows the matching game's title, genre, description, release information, and platforms; the user can return to the catalogue. |
| REQ-DET-02 | Patch notes | The detail view links to that game's patch notes. Notes appear newest first; a game with no notes has an explicit empty message. |
| REQ-FAV-01 | Favourites | A user can add or remove a game from favourites. The button state, favourite list, and count update immediately. |
| REQ-FAV-02 | Persistence | Favourites survive a page reload through browser local storage. Invalid or obsolete stored IDs do not break the page. |
| REQ-FBK-01 | Required fields | The feedback form requires a game, email address, and description. Empty submission does not send a request and identifies each field to fix. |
| REQ-FBK-02 | Validation | Trim surrounding whitespace from email and description. Email must follow the format rules and examples below; description must contain at least 20 Unicode code points after trimming. Invalid values receive useful field-level messages. The API applies the same rules even if called directly. |
| REQ-FBK-03 | Submission | Valid feedback produces a success confirmation; `POST /api/feedback` returns `201` with a record ID, and one matching row is stored. A failed submission preserves entered values and shows an error. |
| REQ-LAY-01 | Responsive layout | At desktop and 375 px phone widths, search, filter, cards, detail content, and feedback controls remain usable without horizontal overflow. |
| REQ-A11Y-01 | Basic access | Interactive elements have user-facing labels or accessible names, work by keyboard, and show visible focus. Loading, empty, error, and confirmation messages are perceivable to assistive technology. |
| REQ-DATA-01 | Sample data | The project provides one documented command that resets a separate test database to the versioned sample data: 8–12 example games and several patch notes. It restores every game and patch-note field, including IDs, content, and dates; removes submitted feedback; and resets the feedback ID counter. A second reset produces the same database contents. Follow the timing and isolation rules below. |

## API acceptance contract

| ID | Request | Expected result |
| --- | --- | --- |
| REQ-API-01 | `GET /api/games` | `200` with `{ games, total, filters }`, where `filters` is `{ search: string, genre: string }`. Both values are `""` when omitted; `search` contains the trimmed query and `genre` contains the selected genre. `total` equals the number of returned games. Results are ordered by title ascending, then ID ascending. |
| REQ-API-02 | `GET /api/games?search=<text>&genre=<genre>` | `200` with games matching both supplied controls. Decode the query, trim search, then measure its length: at most 80 Unicode code points. Matching is case-insensitive. Genre exactly matches one of `Action`, `Adventure`, `Puzzle`, `Racing`, `RPG`, or `Strategy`; an empty genre means all genres. Genre is not trimmed or case-normalized. |
| REQ-API-03 | `GET /api/games/:id` | `200` with `{ game }` for a known positive integer ID. A valid but unknown ID returns `404`. |
| REQ-API-04 | `GET /api/games/:id/patch-notes` | `200` with `{ patchNotes }` for a known game, sorted newest first. A valid but unknown game ID returns `404`. |
| REQ-API-05 | Invalid parameters | Unsupported or repeated query keys, an invalid genre, an overlong search, and a malformed game ID return `400`. Values are treated as data, never as SQL syntax. |
| REQ-API-06 | Error shape | Every API error returns `{ "error": { "code": "...", "message": "..." } }` using the status/code mapping below. An unexpected dependency failure returns `500` with a generic message and no stack trace or SQL details. |
| REQ-API-07 | Feedback | `POST /api/feedback` accepts a JSON object `{ gameId, email, description }` with the types below and returns `201` with `{ id }`. Malformed JSON, missing/extra fields, incorrect types, or values that fail REQ-FBK-02 return `400 INVALID_BODY`; once all fields pass validation, a positive `gameId` that does not exist returns `404 NOT_FOUND`. Neither error inserts a row. Store email and description after trimming. |

### JSON field types

| Object | Fields and types |
| --- | --- |
| List response | `games`: array of game objects; `total`: nonnegative integer number; `filters`: object with `search` and `genre` string fields. |
| Game | `id`: positive safe integer number; `title`, `genre`, `description`: strings; `releaseYear`: integer number; `platforms`: array of strings. |
| Detail response | `game`: one game object. |
| Patch-note response | `patchNotes`: array of patch-note objects. |
| Patch note | `id`, `gameId`: positive safe integer numbers; `version`, `summary`: strings; `publishedAt`: string containing a valid calendar date in `YYYY-MM-DD` format. |
| Feedback request | `gameId`: positive safe integer number; `email`, `description`: strings. All three fields are required; extra fields are rejected. |
| Feedback success | `id`: positive safe integer number. |
| Error response | `error`: object containing `code` and `message` string fields. |

Numeric IDs must be JSON numbers, so `"1"`, `null`, `true`, arrays, and objects are rejected as `gameId`. A safe integer is no greater than `9007199254740991`. IDs in URL paths must consist of decimal digits, start with `1`–`9`, and fit that range.

### Validation rules and examples

Use JavaScript `String.prototype.trim()` to remove surrounding whitespace from search, email, and description. Count Unicode code points after trimming (equivalent to `Array.from(value).length`); an emoji such as `🎮` counts as one. Internal whitespace remains part of search and description, and is forbidden in email.

The project uses a simple email format rule: exactly one `@`; a nonempty local part containing only ASCII letters, digits, `.`, `_`, `+`, or `-`, with no leading, trailing, or consecutive dots; and a domain with at least two nonempty labels separated by dots. Domain labels contain only ASCII letters, digits, or hyphens and start and end with a letter or digit. The final label contains at least two ASCII letters and no other characters.

| Input | Accepted or rejected | Expected normalization / reason |
| --- | --- | --- |
| Email `"  player@example.com  "` | Accepted | Stored as `player@example.com`. |
| Email `"player+qa@games.example.com"` | Accepted | All parts satisfy the format rule. |
| Email `"player@.com"` or `"player@example..com"` | Rejected | Domain contains an empty label. |
| Email `"player name@example.com"` or `"player@ example.com"` | Rejected | Contains internal whitespace. |
| Email `"player@example"` or `"player@@example.com"` | Rejected | Missing domain separator or more than one `@`. |
| Search consisting of spaces | Accepted | Normalized to `""`; any selected genre remains active. |
| Search with 80 `a` characters plus surrounding spaces | Accepted | Trimmed length is 80. |
| Search with 81 `a` characters | Rejected | Returns `400 INVALID_QUERY`. |
| Description `"  12345678901234567890  "` | Accepted | Stored without surrounding spaces; length is 20. |
| Description `"1234567890123456789"` | Rejected | Trimmed length is 19; returns `400 INVALID_BODY`. |

The API uses the same error shape for `400`, `404`, and `500` responses.

| Status | Error code | When used |
| --- | --- | --- |
| `400` | `INVALID_QUERY` | List query has an unsupported or repeated key, invalid genre, or trimmed search longer than 80 Unicode code points. |
| `400` | `INVALID_ID` | A game ID in a detail or patch-note URL fails the decimal format or positive safe integer range defined above. |
| `400` | `INVALID_BODY` | Feedback JSON is malformed, a field is missing/extra, a field has the wrong type or fails validation, or `gameId` is not a positive safe integer. |
| `404` | `NOT_FOUND` | A well-formed game ID is absent, including a feedback request that refers to an unknown game. |
| `500` | `INTERNAL_ERROR` | An unexpected server or database failure. |

### Database initialization and test reset

- Keep the sample games and patch notes in a versioned seed file. Its exact records are the reference for all reset comparisons.
- Initialize a newly created app database with those games and notes and no feedback. Starting the app with an existing database preserves its records.
- The explicit test reset command operates only on a dedicated test database. It restores every seeded game and patch note, removes extra games/notes, clears all feedback, and resets the feedback ID counter. Perform the reset in one transaction; failure leaves the previous contents intact.
- The test runner stops the app, resets the test database, and starts the app before each smoke or full suite run. Reset runs once per suite invocation; it does not run during normal requests or automatically between individual tests.
- Parallel test workers use separate database files. Tests that change games or notes use their own database and reset it before their check. Feedback tests use unique values so they do not depend on earlier submissions.
- Database reset does not clear browser local storage. Tests that need an empty favourites list clear storage separately.

## Risk list

| Risk | Priority | Impact | Planned control / test |
| --- | --- | --- | --- |
| Search and genre disagree when combined | High | Core catalogue results are wrong or misleading. | Seed titles across genres; test partial, case-insensitive search with a selected genre and no-match combinations. |
| API failure looks like an empty result | High | Users and tests may trust false “no games” output. | Exercise controlled `500` and network failures; assert a separate error state and working Retry action. |
| Favourites disappear after reload or attach to the wrong game | High | The persistence promise fails. | Add/remove and reload checks; verify IDs and recovery from malformed local storage. |
| Invalid feedback is accepted or valid feedback is lost | High | Stored reports become unusable or disappear. | Check client and API validation; verify `201` against a SQL row with unique synthetic test data. |
| Detail view shows the wrong game or wrong patch-note order | High | Navigation and update history cannot be trusted. | Compare selected card, detail response, and newest-first note dates using fixed seed IDs. |
| Seed data changes between runs | High | Smoke tests become flaky and results cannot be reproduced. | Use a dedicated test database; verify the full reset with `TEST-DATA-01`, including patch-note content/IDs and feedback removal. |
| Invalid input triggers SQL errors or exposes internals | High | Reliability and data safety are at risk. | Validate parameter names, lengths, genre, and ID; use parameterized SQL; assert safe `400`/`500` bodies. |
| Mobile controls or content overflow | Medium | Phone users cannot complete core paths. | Test a documented 375 px viewport; inspect search/filter, detail, and form with no horizontal scroll. |
| Keyboard or accessible naming gaps | Medium | Controls may be unusable without a pointer or screen reader. | Run axe checks and a manual keyboard/focus pass on catalogue, detail, and feedback. |
| Browser-specific behavior differs | Medium | A smoke pass in one browser may hide failures elsewhere. | Run smoke UI checks in Chromium, Firefox, and WebKit; run the full UI suite in all three in CI. |

## First smoke-test focus

1. Seeded catalogue displays titles and genres.
2. Partial title search returns the expected game.
3. Opening that game shows its matching detail and patch notes.
4. Adding/removing a favourite updates the UI.
5. Valid feedback confirms submission and appears in the database.

Use a clean seeded test database and clear local storage for tests that require a fresh favourites state. Keep feedback records unique per test.
