# Game Companion — Manual Test Scenarios

Status: **All scenarios are planned; none has been executed.** Sources: [requirements](requirements-and-risks.md), [test plan](test-plan.md), and [traceability](traceability-matrix.md). `SCN-` IDs identify manual procedures; `TEST-` IDs identify the separate automation inventory.

## Common setup and recording

Use the documented app/build and a dedicated seeded test database. The implementation owner must first provide actual start/reset commands, the versioned seed, and literal expected IDs/content/order. Record browser/version, viewport, base URL, `DB_PATH`, build/commit, and any failure-injection method. Use synthetic values and a unique feedback description per submission.

Begin storage-sensitive cases with the stated storage state. For catalogue/notes mutations, startup/reset, or a real server-dependency failure, use an isolated per-scenario database/app and follow the stop/reset/restart rules in the requirements. Browser request interception alone does not require database isolation.

Repeat the specified data-driven variants individually. Record a result for each variant; a passing first example does not cover the remaining rules. Required automated browser coverage is defined by the test plan; the initial manual functional pass can use Chromium, with the explicit layout and accessibility coverage below.

For each execution, record: scenario and variant ID; date/build/environment; preconditions and exact inputs; expected/actual result; Passed/Failed/Blocked; evidence link; and `BUG-` or `SIM-` investigation link where applicable. Keep results in an execution log/evidence artifact when runs occur, preserving the planned procedures here. Do not create empty defect claims.

## Catalogue

### SCN-CAT-01 — Initial load

Requirements: `REQ-CAT-01`. Automation: `TEST-UI-01`.

1. Open the catalogue with fresh storage and hold the list response.
2. Verify a perceivable loading message and usable page navigation; release the response.
3. Verify every seeded title/genre, expected order, and displayed count against the seed expectations. Loading ends.

### SCN-CAT-02 — Search, genre, and empty results

Requirements: `REQ-CAT-02` through `REQ-CAT-05`. Automation: `TEST-UI-02` through `TEST-UI-05`.

1. Search an exact title, a partial title shared across genres, ASCII case variants, and the documented `ÉCH` / `éch` / `echo` fixtures. Compare literal expected IDs.
2. Select a genre with that partial search; verify AND results and count without a reload.
3. Clear search while retaining genre, then reapply search and clear genre. Each action removes only its own restriction.
4. Try a no-match search/genre combination. Verify “No games found” and a control to clear filters; clearing restores all expected games.

### SCN-CAT-03 — Invalid-search precedence and pending responses

Requirements: `REQ-CAT-02`, `REQ-CAT-03`, `REQ-CAT-04`. Automation: `TEST-UI-02`, `TEST-UI-04`, `TEST-UI-14`.

1. Load valid results and record their count/control labels. Enter 80 `a` characters with surrounding spaces and 80 emoji as separate accepted variants; verify requests use the trimmed search.
2. Enter 81 `a` characters, then 81 emoji. Verify the associated “Search must be 80 characters or fewer” message, invalid input state, no request, and unchanged prior results/count/labels. The full pasted value is available rather than silently truncated.
3. While invalid, change and clear genre. Only the selection changes; no request or result update occurs. If Retry is visible, activating it also sends no request.
4. Correct or clear search. Validation ends and the request uses the corrected search and latest genre; successful results replace the retained results and clear any catalogue error.
5. Hold an older valid-search response, invalidate search, then release that response. It must not replace retained results. Also enter invalid search before the first valid response completes: show validation with no loaded results and prevent the older response populating them.

### SCN-CAT-04 — Catalogue failure and Retry

Requirements: `REQ-CAT-06`, `REQ-CAT-02`. Automation: `TEST-UI-14`.

1. With valid search/genre, simulate HTTP `500` and a network abort as separate variants.
2. Verify a distinct error and Retry, never a no-results message. Restore the response and Retry; verify current controls determine results and the error clears.
3. Repeat a failure, then enter 81 code points, change genre, and activate Retry. Verify no request, associated validation, and retained error/results.
4. Correct search and verify recovery uses the latest genre. Record each injected failure as a simulation.

### SCN-CAT-05 — Overlapping valid requests and response order

Requirements: `REQ-CAT-04`. Automation: regression variants of `TEST-UI-04`.

1. From the seed expectations, choose two valid search/genre combinations A and B with different expected game IDs and counts. Run search-only changes, genre-only changes, combined changes, and clearing one control as separate variants; search remains valid throughout. Include a variant where A has matches and B has none.
2. Apply A and hold its request. Apply B before A completes and hold B's request. Verify both requests use their respective control values.
3. Release B successfully first. Verify B's exact game IDs/count and no catalogue error or loading message; for no-match B, verify “No games found” and a way to clear the controls. Release A successfully afterwards; B's results/count and all catalogue status messages remain unchanged, and the controls still show B.
4. Repeat with B succeeding first, then fail A using HTTP `500` and a network abort as separate variants. B's results/count remain, with no error, Retry, or renewed loading caused by A. Also complete A while B is still held; A's success or failure cannot end B's loading state or replace the displayed results/messages. Release B and verify its expected results/count.
5. Repeat with B returning `500` first, then release A successfully. The catalogue error and Retry for B remain; A cannot replace them with its results or a no-results message. Record the request URLs, completion order, and expected/actual state for each variant; label injected failures as simulations.

## Detail and patch notes

### SCN-DET-01 — Correct game, note ordering, and empty notes

Requirements: `REQ-DET-01`, `REQ-DET-02`. Automation: `TEST-UI-06`, `TEST-API-01`.

1. Open a seeded game. Compare title, genre, description, release year, and platforms with that selected game; verify Back returns to the catalogue.
2. Follow its notes link. Compare notes to the literal date-descending/ID-descending expectation, including equal-date notes.
3. Open the known no-notes game. Verify its notes request returns `200` with an empty array and the explicit no-notes message.

### SCN-DET-02 — Detail loading, failure, Retry, and stale response

Requirements: `REQ-DET-03`. Automation: regression variants of `TEST-UI-06`.

1. Hold a selected game's detail request. Verify detail loading and available Back navigation.
2. In separate variants, return a contract-shaped `500` and abort the request. Verify “Could not load game details” and Retry, with no unrelated game content or not-found message.
3. Restore success and click Retry. Verify the current ID is requested, loading appears, the error clears, and the matching game is shown.
4. Open an unknown positive game ID with no query. Verify “Game not found”, a way back, and no Retry.
5. Hold game A's response; navigate to game B through the catalogue, then release A. B's view stays current. Repeat with navigation back to the catalogue; A cannot reopen the detail view.

### SCN-DET-03 — Notes loading, failure, Retry, and stale response

Requirements: `REQ-DET-04`. Automation: regression variants of `TEST-UI-06`.

1. Load valid details and follow notes; hold only the notes request. Verify notes loading while details and navigation remain usable.
2. In separate variants, return `500` and abort notes. Verify “Could not load patch notes” and notes Retry; never the no-notes message.
3. Restore success and Retry. The current game's notes are requested; error/loading clear. Run one recovery with ordered notes and another with `200` and an empty array.
4. Simulate a contract-shaped `404 NOT_FOUND` notes response. Verify “Game not found” in the notes area, a way back, and no notes Retry; distinguish this simulation from a genuine data defect.
5. Hold A's notes; navigate to B and release A. A's notes never replace B's content. Repeat after returning to the catalogue.

## Favourites

### SCN-FAV-01 — Toggle and reload

Requirements: `REQ-FAV-01`, `REQ-FAV-02`. Automation: `TEST-UI-07`, `TEST-UI-08`.

1. With empty storage, favourite a game. Verify button state, list membership, and count immediately.
2. Reload; verify the same selection persists. Remove it and reload; verify removal persists.

### SCN-FAV-02 — Storage recovery and catalogue validation

Requirements: `REQ-FAV-02`. Automation: `TEST-UI-08`.

1. Try malformed JSON and non-array JSON separately; reload and verify an empty, usable favourites state.
2. Store an array containing known IDs, duplicates, zero/negative/fractional/string/unsafe IDs, and an obsolete positive ID. Successful complete-catalogue loading removes invalid, duplicate, and obsolete IDs.
3. Repeat while holding the complete unfiltered catalogue and showing filtered results. Valid candidate IDs and count remain, including known games hidden by filtering; filtered responses cannot establish obsolescence.
4. Fail the complete request using `500` and network abort separately. Candidate positive safe integer IDs remain in memory/storage, including the obsolete candidate, until full validation succeeds.
5. Restore the complete catalogue and verify obsolete-ID removal and known-ID retention. Subsequent failed search/filter requests do not remove saved selections.

## Feedback

### SCN-FBK-01 — Required fields

Requirements: `REQ-FBK-01`. Automation: `TEST-UI-09`.

1. Submit an empty form. Verify each required field has a useful associated error and no request is sent.
2. Fill only some fields, then submit. Remaining required fields are identified; entered values remain available for correction.

### SCN-FBK-02 — Named email variants and description boundaries

Requirements: `REQ-FBK-02`, `REQ-API-07`. Automation: `TEST-UI-10`, `TEST-API-02`.

1. Select a known game and use a unique valid description. For each `EMAIL-01` through `EMAIL-27` in the [named email table](requirements-and-risks.md#named-email-variants), submit through the UI and direct API as separate variants.
2. Accepted email: UI confirmation/API `201`; the stored address equals the trimmed original, including preserved letter case. Rejected email: field error and no UI request; API `400 INVALID_BODY` and no inserted row.
3. With valid email, run description variants: empty, whitespace-only, 19 digits, 20 digits, 20 digits surrounded by whitespace, 19 emoji, and 20 emoji. Only values of at least 20 trimmed code points succeed; SQL stores trimmed accepted content.
4. Record a result per email and description variant, including actual response and insertion/non-insertion evidence.

### SCN-FBK-03 — Successful storage and failure preservation

Requirements: `REQ-FBK-03`, `REQ-API-07`. Automation: `TEST-UI-11`, `TEST-API-03`.

1. Submit a valid form with synthetic unique content. Verify success, `201` with numeric positive safe ID, and exactly one matching row in the same `DB_PATH`.
2. Fail the feedback request with `500` and network abort separately. Verify an error and that selected game, email, and description stay exactly as entered, including surrounding spaces.
3. For direct API calls without query keys, test malformed JSON, missing/extra fields, wrong types, and invalid values. Verify `400 INVALID_BODY` and no insertion.
4. Submit a valid body with an unknown positive game ID: `404 NOT_FOUND` and no insertion. Combine an invalid body field with an unknown game: `400 INVALID_BODY` precedes lookup. Use unique content for accepted requests and do not assume an ID of `1` here.

## Layout and access

### SCN-LAY-01 — Desktop and phone usability

Requirements: `REQ-LAY-01`. Automation: `TEST-UI-13`.

1. At 1280 x 800 in Chromium, Firefox, and WebKit, use search, genre, cards, detail/notes, favourites, and feedback.
2. Repeat at 375 x 812 in Chromium. Controls/content remain usable, labels and errors visible, and there is no horizontal page overflow. Include pending/error states and a long description/note.
3. Record WebKit phone results if run; otherwise record optional coverage as not run. The full phone suite and Firefox phone coverage are not required.

### SCN-A11Y-01 — Keyboard, focus, and announcements

Requirements: `REQ-A11Y-01`. Automation: `TEST-UI-12`, `TEST-A11Y-01`, `TEST-A11Y-02`.

1. Use only the keyboard to navigate catalogue, detail/notes, favourites, and feedback; operate controls, follow links, submit, and Retry. Verify accessible names, logical focus, and visible focus throughout.
2. With an available screen-reader/browser pairing, trigger loading, no results, each request error, feedback confirmation, and overlong search. Verify useful announcements and validation associations; record the actual pairing/version.
3. Run axe on catalogue, detail, and feedback when the automation/tooling is available. No critical/serious violations are allowed. Record lower-impact findings separately; axe does not establish full accessibility conformance.

## API and data lifecycle

### SCN-API-01 — Successful contracts and ordering

Requirements: `REQ-API-01` through `REQ-API-04`. Automation: `TEST-API-01`.

1. Request list, filtered list, known detail, known notes, and no-notes game. Verify status/schema and literal expected IDs/content.
2. Verify normalized filters, total, combined AND matching, ASCII/non-ASCII matching, numeric code-point title ordering, and ID ascending for equal folded titles.
3. Verify notes date descending then ID descending; known no-notes returns `200` and `{ patchNotes: [] }`.

### SCN-API-02 — Query/ID boundaries and error precedence

Requirements: `REQ-API-02` through `REQ-API-07`. Automation: `TEST-API-02`.

1. On list, test search lengths 80/81 with ASCII and emoji, whitespace trimming, empty values, exact genre values, invalid case/whitespace genre, unsupported/case-mismatched query names, and repeated search/genre including empty repeats. Verify `200` or `400 INVALID_QUERY` as specified; punctuation is literal data.
2. On known detail and notes routes and feedback with a valid body, supply `?search=`, `?genre=Action`, `?extra=1`, and repeated keys separately. Each returns `400 INVALID_QUERY`; feedback inserts no row. A bare trailing `?` is accepted.
3. Test path IDs `0`, `-1`, `01`, `1.5`, `abc`, and `9007199254740992`: `400 INVALID_ID`. An unknown valid positive ID with no query returns `404 NOT_FOUND`. Use `9007199254740991` for the valid upper boundary, returning `404` if absent.
4. Combine malformed path ID with query: `INVALID_ID`; unknown valid ID with query: `INVALID_QUERY`. Feedback query plus invalid body returns `INVALID_QUERY`; without query, invalid body precedes unknown-game lookup.
5. Verify every error body has string code/message fields and matches the error mapping; rejected feedback leaves rows unchanged.

### SCN-API-03 — Safe server-dependency failure

Requirements: `REQ-API-06`. Automation: `TEST-API-04`.

1. Start an isolated seeded app/database and use its documented test-only dependency-failure mechanism.
2. Make an actual API request. Verify `500 INTERNAL_ERROR`, a generic message, and no stack/SQL details in the response.
3. Record hook/setup/request/response and recovery evidence as a `SIM-` investigation. Do not substitute client-side mocking for this server check.

### SCN-DATA-01 — New/existing database and transactional reset

Requirements: `REQ-DATA-01`. Automation: `TEST-DATA-01`.

1. **New startup:** allocate a nonexistent isolated path and start without reset. Compare every seeded game/note field and ID; feedback is empty.
2. **Existing startup:** seed an isolated database, change/delete/add games and notes, and submit feedback. Capture all rows/counter state, stop and await the app, restart without reset, and verify exact preservation.
3. **Reset:** stop and await the isolated app, reset the modified database, then compare every seeded field/ID, removed additions, and empty feedback. Repeat reset and compare equal baselines. Restart and verify the next accepted feedback ID is `1`.
4. **Rollback:** from a modified isolated database, capture rows/counter, stop and await the app, inject reset failure after changes begin and before commit, and verify the entire captured state is unchanged.
5. Use separate paths from the ordinary suite and record SQL snapshots/reset logs. No reset operation may affect the ordinary app/database.
