# Game Companion — Acceptance Criteria and Risk List

Source: [`PROJECT_PLAN.md`](../PROJECT_PLAN.md). These criteria define observable behavior for the planned first version. Requirement IDs can be reused in test scenarios and the traceability matrix.

## Acceptance criteria

| ID | Area | Criterion |
| --- | --- | --- |
| CAT-01 | Catalogue | On load, the page requests `GET /api/games`, shows a loading state while waiting, then displays every returned game with its title and genre. |
| CAT-02 | Search | Search matches a case-insensitive, trimmed substring of a game title. Clearing search removes only the search restriction; if a genre is selected, results still show only that genre. |
| CAT-03 | Genre filter | Selecting a genre shows only games in that genre. Clearing the genre removes only the genre restriction; any search text still limits the results. |
| CAT-04 | Combined controls | Search and genre apply together with AND logic. Changing either control updates the results and their count without requiring a page reload. |
| CAT-05 | No results | A valid search/filter combination with zero matches displays “No games found” and a way to clear the controls. It does not show a blank page. |
| CAT-06 | Load failure | A failed catalogue request displays a distinct error message and a Retry action. The UI never presents an API failure as “No games found.” |
| DET-01 | Game detail | Opening a catalogue game shows the matching game's title, genre, description, release information, and platforms; the user can return to the catalogue. |
| DET-02 | Patch notes | The detail view links to that game's patch notes. Notes appear newest first; a game with no notes has an explicit empty message. |
| FAV-01 | Favourites | A user can add or remove a game from favourites. The button state, favourite list, and count update immediately. |
| FAV-02 | Persistence | Favourites survive a page reload through browser local storage. Invalid or obsolete stored IDs do not break the page. |
| FBK-01 | Required fields | The feedback form requires a game, email address, and description. Empty submission does not send a request and identifies each field to fix. |
| FBK-02 | Validation | Email must have one `@`, non-empty text on both sides, and a dot in the domain. Description must contain at least 20 characters after trimming. Invalid values receive useful field-level messages. The API applies the same rules even if called directly. |
| FBK-03 | Submission | Valid feedback produces a success confirmation; `POST /api/feedback` returns `201` with a record ID, and one matching row is stored. A failed submission preserves entered values and shows an error. |
| LAY-01 | Responsive layout | At desktop and 375 px phone widths, search, filter, cards, detail content, and feedback controls remain usable without horizontal overflow. |
| A11Y-01 | Basic access | Interactive elements have user-facing labels or accessible names, work by keyboard, and show visible focus. Loading, empty, error, and confirmation messages are perceivable to assistive technology. |
| DATA-01 | Sample data | The project provides one command that fills a separate test database with 8–12 example games and several patch notes. Running that command again restores the same games, with the same IDs and note dates, so tests always start with predictable data. |

## API acceptance contract

| ID | Request | Expected result |
| --- | --- | --- |
| API-01 | `GET /api/games` | `200` with `{ games, total, filters }`, where `filters` is `{ search: string, genre: string }`. Both values are `""` when omitted; `search` contains the trimmed query and `genre` contains the selected genre. `total` equals the number of returned games. Results are ordered by title ascending, then ID ascending. |
| API-02 | `GET /api/games?search=<text>&genre=<genre>` | `200` with games matching both supplied controls. Search is trimmed, case-insensitive, and at most 80 characters. Genre exactly matches one of `Action`, `Adventure`, `Puzzle`, `Racing`, `RPG`, or `Strategy`; an empty genre means all genres. |
| API-03 | `GET /api/games/:id` | `200` with `{ game }` for a known positive integer ID. A valid but unknown ID returns `404`. |
| API-04 | `GET /api/games/:id/patch-notes` | `200` with `{ patchNotes }` for a known game, sorted newest first. A valid but unknown game ID returns `404`. |
| API-05 | Invalid parameters | Unsupported or repeated query keys, an invalid genre, an overlong search, and a malformed game ID return `400`. Values are treated as data, never as SQL syntax. |
| API-06 | Error shape | Every API error returns `{ "error": { "code": "...", "message": "..." } }` using the status/code mapping below. An unexpected dependency failure returns `500` with a generic message and no stack trace or SQL details. |
| API-07 | Feedback | `POST /api/feedback` accepts JSON `{ gameId, email, description }` and returns `201` with `{ id }`. Malformed JSON, missing fields, or values that fail FBK-02 return `400 INVALID_BODY`; a well-formed positive `gameId` that does not exist returns `404 NOT_FOUND`. Neither error inserts a row. |

Each game response has `{ id, title, genre, releaseYear, platforms, description }`, with `platforms` as a string array. Each patch note has `{ id, gameId, version, publishedAt, summary }`, with `publishedAt` in `YYYY-MM-DD` format. The API uses the same error shape for `400`, `404`, and `500` responses.

| Status | Error code | When used |
| --- | --- | --- |
| `400` | `INVALID_QUERY` | List query has an unsupported or repeated key, invalid genre, or search longer than 80 characters. |
| `400` | `INVALID_ID` | A game ID in a detail or patch-note URL is not a positive integer. |
| `400` | `INVALID_BODY` | Feedback JSON is malformed, a field is missing/invalid, or `gameId` is not a positive integer. |
| `404` | `NOT_FOUND` | A well-formed game ID is absent, including a feedback request that refers to an unknown game. |
| `500` | `INTERNAL_ERROR` | An unexpected server or database failure. |

## Risk list

| Risk | Priority | Impact | Planned control / test |
| --- | --- | --- | --- |
| Search and genre disagree when combined | High | Core catalogue results are wrong or misleading. | Seed titles across genres; test partial, case-insensitive search with a selected genre and no-match combinations. |
| API failure looks like an empty result | High | Users and tests may trust false “no games” output. | Exercise controlled `500` and network failures; assert a separate error state and working Retry action. |
| Favourites disappear after reload or attach to the wrong game | High | The persistence promise fails. | Add/remove and reload checks; verify IDs and recovery from malformed local storage. |
| Invalid feedback is accepted or valid feedback is lost | High | Stored reports become unusable or disappear. | Check client and API validation; verify `201` against a SQL row with unique synthetic test data. |
| Detail view shows the wrong game or wrong patch-note order | High | Navigation and update history cannot be trusted. | Compare selected card, detail response, and newest-first note dates using fixed seed IDs. |
| Seed data changes between runs | High | Smoke tests become flaky and results cannot be reproduced. | Use a dedicated test database and deterministic reseed; keep stable IDs, titles, genres, and dates. |
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
