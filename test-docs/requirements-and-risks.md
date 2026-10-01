# Game Companion — Acceptance Criteria and Risk List

Source: [`PROJECT_PLAN.md`](../PROJECT_PLAN.md). These criteria define observable behavior for the planned first version. Requirement IDs begin with `REQ-`; automated test IDs in the plan begin with `TEST-`. Traceability records link these distinct IDs rather than using one ID for both a requirement and a test. For example, `REQ-API-03` defines the detail endpoint and `TEST-API-01` checks list/detail responses.

## Acceptance criteria

| ID | Area | Criterion |
| --- | --- | --- |
| REQ-CAT-01 | Catalogue | On load, the page requests `GET /api/games`, shows a loading state while waiting, then displays every returned game with its title and genre. |
| REQ-CAT-02 | Search | Search matches a trimmed substring of a game title using the ASCII case rule below. Clearing search removes only the search restriction; if a genre is selected, results still show only that genre. If trimmed search exceeds 80 Unicode code points, show “Search must be 80 characters or fewer” beside the input, mark it invalid, and send no catalogue request, including from genre changes or Retry. This rule takes precedence over REQ-CAT-03/04/06. Keep the previous results and count visible and identify their previous valid search and genre values. Genre selection may change, but results remain unchanged until search is valid. On correction, remove validation and request results using the corrected search and currently selected genre. |
| REQ-CAT-03 | Genre filter | When search is valid, selecting a genre shows only games in that genre. Clearing the genre removes only the genre restriction; any search text still limits the results. While search is invalid, follow REQ-CAT-02. |
| REQ-CAT-04 | Combined controls | Search and genre apply together with AND logic. When search is valid, changing either control updates the results and their count without requiring a page reload. While search is invalid, follow REQ-CAT-02. |
| REQ-CAT-05 | No results | A valid search/filter combination with zero matches displays “No games found” and a way to clear the controls. It does not show a blank page. |
| REQ-CAT-06 | Load failure | A failed catalogue request displays a distinct error message and a Retry action. The UI never presents an API failure as “No games found.” Retry requests the current search and genre only when search is valid. If search is invalid, activating Retry sends no request, keeps the error and any previous results visible, and shows the REQ-CAT-02 validation message. |
| REQ-DET-01 | Game detail | Opening a catalogue game shows the matching game's title, genre, description, release information, and platforms; the user can return to the catalogue. |
| REQ-DET-02 | Patch notes | The detail view links to that game's patch notes. Notes appear by publication date descending, then ID descending for notes on the same date; a game with no notes has an explicit empty message. |
| REQ-DET-03 | Detail loading and failure | While the detail request is pending, show a detail loading message and keep navigation back to the catalogue available. HTTP `500` or a network failure shows “Could not load game details” and a Retry action, without showing another game's content or a not-found message. Retry requests the same currently selected game ID, shows loading, and on success clears the error and displays that game. `404 NOT_FOUND` shows “Game not found” and a way back to the catalogue; no Retry is offered for `404`. Navigating to another game or back to the catalogue prevents an older response from replacing the current view. |
| REQ-DET-04 | Patch-note loading and failure | When the user follows the patch-note link, show a notes loading message while the request is pending. HTTP `500` or a network failure shows “Could not load patch notes” and a notes Retry action; it never shows the no-notes message for a failed request. Keep the successfully loaded game details and catalogue navigation available. Retry requests notes for the currently selected game, shows loading, and on success clears the error and displays the ordered notes or the explicit no-notes message for `200` with an empty array. `404 NOT_FOUND` shows “Game not found” in the notes area with a way back and no notes Retry. Navigating away prevents an older notes response from updating another game's view. |
| REQ-FAV-01 | Favourites | A user can add or remove a game from favourites. The button state, favourite list, and count update immediately. |
| REQ-FAV-02 | Persistence | Favourites survive a page reload through browser local storage. Malformed JSON or a value that is not an array is treated as an empty favourites list. Within an array, ignore invalid IDs and remove duplicates; validate the remaining positive safe integer IDs against a successfully loaded complete, unfiltered catalogue. “Known” means present in that catalogue; “obsolete” means absent from it. Filtered results cannot establish that an ID is obsolete. If the complete catalogue has not loaded or its request fails, retain those candidate IDs in memory and storage and defer obsolete-ID removal until a complete request succeeds. Failed search/filter requests also never remove saved favourites. The page remains usable and the count reflects the retained list. |
| REQ-FBK-01 | Required fields | The feedback form requires a game, email address, and description. Empty submission does not send a request and identifies each field to fix. |
| REQ-FBK-02 | Validation | Trim surrounding whitespace from email and description. Email must follow the format rules and examples below; description must contain at least 20 Unicode code points after trimming. Invalid values receive useful field-level messages. The API applies the same rules even if called directly. |
| REQ-FBK-03 | Submission | Valid feedback produces a success confirmation; `POST /api/feedback` returns `201` with a record ID, and one matching row is stored. A failed submission preserves entered values and shows an error. |
| REQ-LAY-01 | Responsive layout | At viewport widths of 1280 px (desktop) and 375 px (phone), search, filter, cards, detail content, and feedback controls remain usable without horizontal overflow. |
| REQ-A11Y-01 | Basic access | Interactive elements have user-facing labels or accessible names, work by keyboard, and show visible focus. Loading, empty, error, and confirmation messages are perceivable to assistive technology. |
| REQ-DATA-01 | Sample data and initialization | Starting the app at a nonexistent database path creates a database with the exact versioned sample games and patch notes and no feedback. Starting with an existing database preserves all records and feedback ID-counter state. The project provides one documented command that resets a separate test database to that sample data: 8–12 example games and several patch notes meeting the fixture prerequisites below. It restores every game and patch-note field, including IDs, content, and dates; removes submitted feedback; and resets the feedback ID counter. A second reset produces the same database contents. Follow the timing and isolation rules below. |

## API acceptance contract

| ID | Request | Expected result |
| --- | --- | --- |
| REQ-API-01 | `GET /api/games` | `200` with `{ games, total, filters }`, where `filters` is `{ search: string, genre: string }`. Both values are `""` when omitted; `search` contains the trimmed query and `genre` contains the selected genre. `total` equals the number of returned games. Results use the title comparison rule below, then ID ascending. |
| REQ-API-02 | `GET /api/games?search=<text>&genre=<genre>` | `200` with games matching both supplied controls. Decode the query, trim search, then measure its length: at most 80 Unicode code points. Matching uses the ASCII case rule below. Genre exactly matches one of `Action`, `Adventure`, `Puzzle`, `Racing`, `RPG`, or `Strategy`; an empty genre means all genres. Genre is not trimmed or case-normalized. |
| REQ-API-03 | `GET /api/games/:id` | `200` with `{ game }` for a known positive integer ID. A valid but unknown ID returns `404`. This endpoint accepts no query keys. |
| REQ-API-04 | `GET /api/games/:id/patch-notes` | `200` with `{ patchNotes }` for a known game, ordered by `publishedAt` descending, then ID descending. A known game without notes returns `{ patchNotes: [] }`; a valid but unknown game ID returns `404`. This endpoint accepts no query keys. |
| REQ-API-05 | Invalid parameters | The list endpoint accepts only `search` and `genre`, each at most once. Unsupported/repeated keys, an invalid genre, or an overlong search return `400 INVALID_QUERY`. Detail, patch-note, and feedback endpoints accept no query keys: any supplied key, including an empty-valued or repeated key, returns `400 INVALID_QUERY`. A malformed path ID returns `400 INVALID_ID`. Values are treated as data, never as SQL syntax. Follow the validation order below when more than one input is invalid. |
| REQ-API-06 | Error shape | Every API error returns `{ "error": { "code": "...", "message": "..." } }` using the status/code mapping below. An unexpected dependency failure returns `500` with a generic message and no stack trace or SQL details. |
| REQ-API-07 | Feedback | `POST /api/feedback` accepts no query keys and a JSON object `{ gameId, email, description }` with the types below, returning `201` with `{ id }`. After query validation succeeds, malformed JSON, missing/extra fields, incorrect types, or values that fail REQ-FBK-02 return `400 INVALID_BODY`; once all fields pass validation, a positive `gameId` that does not exist returns `404 NOT_FOUND`. No error inserts a row. Store email and description after trimming. |

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

### Query scope and validation order

| Endpoint | Allowed query keys | Validation order |
| --- | --- | --- |
| `GET /api/games` | `search`, `genre`; each may occur once, including an empty value | Validate query keys/cardinality, then values, then read the database. |
| `GET /api/games/:id` | None | Validate path ID, then reject any query keys, then look up the game. |
| `GET /api/games/:id/patch-notes` | None | Validate path ID, then reject any query keys, then look up the game and its notes. |
| `POST /api/feedback` | None | Reject any query keys, then parse/validate the body, then look up the game and insert. |

A bare trailing `?` contains no keys and is accepted. `?search=` is a supplied key and is rejected on detail, notes, and feedback routes. Query names are case-sensitive. For example, an unknown positive detail ID with `?genre=Action` returns `400 INVALID_QUERY`; a malformed detail ID with that query returns `400 INVALID_ID`. Feedback without query keys validates every body field before deciding whether a game exists.

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
| Search with 80 `🎮` characters | Accepted | Each emoji counts as one code point. |
| Description `"  12345678901234567890  "` | Accepted | Stored without surrounding spaces; length is 20. |
| Description `"1234567890123456789"` | Rejected | Trimmed length is 19; returns `400 INVALID_BODY`. |

#### Named email variants

Execute every row through both the feedback UI (`TEST-UI-10`) and the direct API (`TEST-API-02`). Keep the selected game valid and the description at least 20 code points so each row isolates the email rule. Accepted API variants return `201` and store the trimmed address; rejected UI variants show a field error with no submission, and rejected API variants return `400 INVALID_BODY` with no inserted row. Use a unique synthetic description per accepted submission.

| Variant | Email input | Expected | Rule exercised |
| --- | --- | --- | --- |
| EMAIL-01 | `  player@example.com  ` | Accept as `player@example.com` | Surrounding whitespace is trimmed. |
| EMAIL-02 | `Player09.first_qa+tag-test@example.com` | Accept | Local part permits ASCII upper/lowercase letters, digits, single dots, underscore, plus, and hyphen. |
| EMAIL-03 | `player@games-2.example.com` | Accept | Multiple domain labels, digits, and an internal hyphen are allowed. |
| EMAIL-04 | `player@example.co` | Accept | Final label with exactly two ASCII letters is valid. |
| EMAIL-05 | `player@example.COM` | Accept | Final-label letters can be uppercase; do not lowercase stored email. |
| EMAIL-06 | `@example.com` | Reject | Local part is empty. |
| EMAIL-07 | `.player@example.com` | Reject | Local part starts with a dot. |
| EMAIL-08 | `player.@example.com` | Reject | Local part ends with a dot. |
| EMAIL-09 | `play..er@example.com` | Reject | Local part has consecutive dots. |
| EMAIL-10 | `player!qa@example.com` | Reject | Local part contains a disallowed ASCII character. |
| EMAIL-11 | `pláyer@example.com` | Reject | Local part contains a non-ASCII letter. |
| EMAIL-12 | `player name@example.com` | Reject | Local part contains internal whitespace. |
| EMAIL-13 | `player.example.com` | Reject | Missing `@`. |
| EMAIL-14 | `player@@example.com` | Reject | More than one `@`. |
| EMAIL-15 | `player@` | Reject | Domain is empty. |
| EMAIL-16 | `player@example` | Reject | Domain has only one label. |
| EMAIL-17 | `player@.example.com` | Reject | First domain label is empty. |
| EMAIL-18 | `player@example..com` | Reject | Intermediate domain label is empty. |
| EMAIL-19 | `player@example.com.` | Reject | Final domain label is empty. |
| EMAIL-20 | `player@-example.com` | Reject | Domain label starts with a hyphen. |
| EMAIL-21 | `player@example-.com` | Reject | Domain label ends with a hyphen. |
| EMAIL-22 | `player@exam_ple.com` | Reject | Domain contains a disallowed ASCII character. |
| EMAIL-23 | `player@exámple.com` | Reject | Domain contains a non-ASCII letter. |
| EMAIL-24 | `player@ example.com` | Reject | Domain contains internal whitespace. |
| EMAIL-25 | `player@example.c` | Reject | Final label has fewer than two letters. |
| EMAIL-26 | `player@example.c0m` | Reject | Final label contains a digit. |
| EMAIL-27 | `player@example.co-m` | Reject | Final label contains a hyphen. |

The search examples describe direct API requests. In the UI, an overlong value produces the field validation behavior in `REQ-CAT-02` and no request. Allow the user to enter or paste the full value so it can be explained rather than silently truncated. For an invalid search entered before any valid results have loaded, show the validation message with no catalogue results. Invalidating the input cancels any pending search update and prevents an older response from replacing the retained results. Associate the message with the input and announce it to assistive technology.

While search is invalid, changing or clearing genre updates the control's selected value only; it does not change displayed results, their count, or the label identifying the previous valid controls. Retry cannot bypass this rule. Correcting or clearing search resumes requests with the latest genre selection; a successful response replaces retained results and clears any catalogue error.

### Search comparison and ordering

- For search matching, convert only ASCII `A`–`Z` to `a`–`z` in both title and query, then perform a literal substring comparison. All other Unicode code points stay unchanged; there is no accent removal or Unicode normalization. For example, `ÉCH` matches `Écho`, while `éch` and `echo` do not match `Écho`.
- For catalogue ordering, apply the same ASCII conversion to titles, then compare their Unicode code-point sequences in ascending numeric order. A shorter sequence sorts first when it is a prefix of the other. Do not use browser or operating-system locale ordering. When these title keys are equal, sort by numeric game ID ascending.
- For patch notes, compare valid `YYYY-MM-DD` publication dates descending; equal dates sort by numeric note ID descending. If notes 8 and 9 share a date, note 9 appears first.

The API uses the same error shape for `400`, `404`, and `500` responses.

| Status | Error code | When used |
| --- | --- | --- |
| `400` | `INVALID_QUERY` | List query has an unsupported or repeated key, invalid genre, or trimmed search longer than 80 Unicode code points; or any query key is supplied to detail, patch-note, or feedback endpoints. |
| `400` | `INVALID_ID` | A game ID in a detail or patch-note URL fails the decimal format or positive safe integer range defined above. |
| `400` | `INVALID_BODY` | Feedback JSON is malformed, a field is missing/extra, a field has the wrong type or fails validation, or `gameId` is not a positive safe integer. |
| `404` | `NOT_FOUND` | A well-formed game ID is absent, including a feedback request that refers to an unknown game. |
| `500` | `INTERNAL_ERROR` | An unexpected server or database failure. |

### Seed fixture prerequisites

The versioned seed must provide all of the following within its 8–12 games and several patch notes. Fixtures may serve more than one purpose.

| Fixture | Required data | Planned coverage |
| --- | --- | --- |
| Search and combined filters | Games sharing a searchable title substring across at least two genres, plus another game in one of those genres that does not match it. Record exact expected IDs for search, genre, combined, and no-match queries. | TEST-UI-02, TEST-UI-03, TEST-UI-04, TEST-UI-05, TEST-API-01 |
| Non-ASCII comparison | Include `Écho` and an ASCII title such as `Zeta`: `ÉCH` matches `Écho`, while `éch` and `echo` do not; `Zeta` sorts before `Écho` by code point. | TEST-UI-02, TEST-API-01 |
| Equal folded title keys | At least two distinct games with titles that differ only in ASCII case, such as `Orbit` and `ORBIT`, and different fixed IDs. Their equal folded keys require numeric game ID ascending. | TEST-API-01 |
| Patch-note ordering | At least one game with notes on different dates and at least two notes sharing a date, each with a different fixed ID. Expected order is date descending, then note ID descending. | TEST-UI-06, TEST-API-01 |
| No patch notes | At least one known game with no patch-note records. | TEST-UI-06, TEST-API-01 |

Keep exact IDs, field values, dates, and fixture expectations versioned. Tests compare results against these expectations rather than deriving expected order with the application's comparison function.

### Database initialization and test reset

- Keep the sample games and patch notes in a versioned seed file. Its exact records are the reference for all reset comparisons.
- Initialize a newly created app database with those games and notes and no feedback. Starting the app with an existing database preserves all records and feedback ID-counter state, including changed/extra games and notes, deleted seed records, and submitted feedback; startup does not restore the seed baseline.
- The explicit test reset command operates only on a dedicated test database. It restores every seeded game and patch note, removes extra games/notes, clears all feedback, and resets the feedback ID counter so the next accepted feedback record has ID `1`. Perform the reset in one transaction; failure leaves all previous records and ID-counter state intact.
- Run all app/database-dependent tests serially (`workers: 1` in Playwright, with no overlapping browser projects against the same app). Each suite invocation or independent CI job allocates its own absolute database path, for example `test-results/<run-id>/games.sqlite`; that path is not shared between invocations or jobs.
- The runner passes that exact path through `DB_PATH` to both the reset command and the app process. It starts one app on an available port, obtains its URL, and sets the browser/API test base URL to that instance. SQL verification opens the same `DB_PATH`. The runner owns this app process and stops it at the end of the run.
- Before the ordinary suite tests, stop the owned app if present, wait for it to exit and release SQLite connections, reset the database once, then start the app and wait for readiness. Ordinary tests do not reset between cases; feedback submissions write to this suite database, use unique values, and never assume their new ID is `1`.
- Checks that mutate catalogue/patch notes, verify database startup or reset, or fail a server dependency allocate a separate per-test database path and app instance. Pass that path to every reset, app, and SQL operation for that test. Reset before setup except for the new-database startup variant below; stop and await the isolated app before any reset inside the test, then restart it if the check requires requests. These additional resets never affect the ordinary suite database. Ordinary feedback submissions alone do not require isolation. The first-feedback-ID assertion belongs to the isolated reset check.
- TEST-DATA-01 startup variants use that same isolation: for new-database startup, choose a path that does not exist and start the app without running reset first; verify every seeded game/note field and ID and an empty feedback table. For existing-database startup, create a seeded baseline, change/delete/add games and notes, and submit feedback; capture all rows and ID-counter state, stop and await the app, restart against the same path without reset, and verify the captured state is unchanged.
- A failed-reset variant injects a controlled failure after database changes have begun and before commit in the isolated database. Compare all rows and ID-counter state before and after the failed command to verify rollback. The failure hook is available only to the test reset mechanism.
- Database reset does not clear browser local storage. Tests that need an empty favourites list clear storage separately.

## Risk list

| Risk | Priority | Impact | Planned control / test |
| --- | --- | --- | --- |
| Search and genre disagree when combined | High | Core catalogue results are wrong or misleading. | Seed titles across genres; test partial, case-insensitive search with a selected genre and no-match combinations. |
| API failure looks like an empty result | High | Users and tests may trust false “no games” output. | Exercise controlled `500` and network failures; assert a separate error state and working Retry action. |
| Favourites disappear after reload or attach to the wrong game | High | The persistence promise fails. | Add/remove and reload checks; verify storage recovery, complete-catalogue validation, and retention during filtered or failed requests. |
| Invalid feedback is accepted or valid feedback is lost | High | Stored reports become unusable or disappear. | Check client and API validation; verify `201` against a SQL row with unique synthetic test data. |
| Detail view shows the wrong game or wrong patch-note order | High | Navigation and update history cannot be trusted. | Compare selected card, detail response, and newest-first note dates using fixed seed IDs. |
| Detail or notes failures are hidden or a late response shows another game | High | Users may trust missing or unrelated information. | Hold requests to observe loading; simulate detail and notes failures separately, verify scoped Retry and `404`, and navigate while an older response is pending. |
| Startup changes existing data or test baselines drift | High | Saved records may be lost; tests become flaky and results cannot be reproduced. | Use a dedicated test database; verify new/existing database startup and the full reset with `TEST-DATA-01`, including every seeded field/ID, feedback, and counter state. |
| Invalid input triggers SQL errors or exposes internals | High | Reliability and data safety are at risk. | Validate parameter names, lengths, genre, and ID; use parameterized SQL; assert safe `400`/`500` bodies. |
| Mobile controls or content overflow | Medium | Phone users cannot complete core paths. | Test a documented 375 px viewport; inspect search/filter, detail, and form with no horizontal scroll. |
| Keyboard or accessible naming gaps | Medium | Controls may be unusable without a pointer or screen reader. | Run axe checks and a manual keyboard/focus pass on catalogue, detail, and feedback. |
| Browser-specific behavior differs | Medium | A smoke pass in one browser may hide failures elsewhere. | Run desktop smoke and full desktop UI regression in Chromium, Firefox, and WebKit; run the phone layout variant in Chromium, with optional WebKit coverage. |

## First smoke-test focus

1. Seeded catalogue displays titles and genres.
2. Partial title search returns the expected game.
3. Opening that game shows its matching detail and patch notes.
4. Adding/removing a favourite updates the UI.
5. Valid feedback confirms submission and appears in the database.

Use a clean seeded test database and clear local storage for tests that require a fresh favourites state. Keep feedback records unique per test.
