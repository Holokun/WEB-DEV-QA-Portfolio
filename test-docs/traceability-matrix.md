# Game Companion — Planned Traceability Matrix

Sources: [acceptance criteria and API contract](requirements-and-risks.md) and [test inventory](../PROJECT_PLAN.md). All checks below are **planned**, with no execution result or defect claim. A test ID names an inventory entry; named variants are separate checks under that entry. Smoke runs the primary successful paths of Smoke entries. Validation, failure, recovery, and empty-state variants run in regression.

| Requirement | Planned test(s) | Explicit assertions / variants |
| --- | --- | --- |
| `REQ-CAT-01` | `TEST-UI-01` | Hold the initial response to observe loading; release it and verify every seeded title/genre appears. |
| `REQ-CAT-02` | `TEST-UI-02`, `TEST-UI-04`, `TEST-UI-14` | Exact/partial and ASCII case search; clearing search retains genre. Boundary variants: 80 code points accepted, 81 show the field message and make no request; include emoji and surrounding spaces. While invalid, change/clear genre and activate Retry: no requests, retained results/count and their previous valid control labels stay unchanged. First-load invalid input shows no results. Correcting/clearing search removes validation and requests the latest genre selection. An older pending response cannot replace retained results after input becomes invalid. |
| `REQ-CAT-03` | `TEST-UI-03`, `TEST-UI-04` | With valid search, selected genre includes only matching games; clearing genre keeps the active title search. With invalid search, selection changes but results/count remain unchanged until correction. |
| `REQ-CAT-04` | `TEST-UI-04`, `SCN-CAT-05` | Search and genre use AND logic; with valid search, changing or clearing either updates the count/results without reload. Invalid-search precedence defers genre updates; correcting search applies the current genre. Hold overlapping valid requests A then B; complete B before A for search-only, genre-only, combined, and clearing-control variants, including no-match B. B's exact results/count and loading/empty/error states remain authoritative after A succeeds or fails. A cannot end loading while B is pending or clear B's error after B fails. |
| `REQ-CAT-05` | `TEST-UI-05` | No-match search/filter shows “No games found”; clearing controls restores the catalogue. |
| `REQ-CAT-06` | `TEST-UI-14` | Separate variants for HTTP `500` and an aborted network request: show error and Retry, never empty results. With valid search, restore a successful response, click Retry, and verify results match the current search/genre and the error disappears. Invalid-search variant: after failure, enter 81 code points, change genre, and activate Retry; no request is sent and error/retained results remain. Correct search and verify recovery uses the latest genre. |
| `REQ-DET-01` | `TEST-UI-06` | Card and detail refer to the same game; title, genre, description, release year, and platforms match; Back returns to the catalogue. |
| `REQ-DET-02` | `TEST-UI-06`, `TEST-API-01` | Follow the patch-note link; dates descend and equal-date notes use ID descending. Empty-notes variant: a known game without notes returns `200` with `{ patchNotes: [] }` and the UI shows its explicit empty message. |
| `REQ-DET-03` | `TEST-UI-06`, `SCN-DET-02` | Detail variants: held request shows loading and usable Back navigation; HTTP `500` and network failure show the detail error and Retry; restore success and Retry the current ID, clearing error/loading. Unknown game shows “Game not found”, Back, and no Retry. Navigate to another game or catalogue before releasing an older response; it cannot replace the current view. These variants are regression only. |
| `REQ-DET-04` | `TEST-UI-06`, `SCN-DET-03` | Notes variants: loading, HTTP `500`, and network failure are distinct from empty notes; game details and navigation remain usable. Retry the current game's notes and recover to ordered notes or `200` empty state. Notes `404` shows “Game not found” and no notes Retry. Late notes responses cannot update another game after navigation. These variants are regression only. |
| `REQ-FAV-01` | `TEST-UI-07` | Add/remove changes button state, favourite list, and count immediately. |
| `REQ-FAV-02` | `TEST-UI-08` | Reload preserves valid selections. Storage variants: malformed JSON and non-array JSON recover to empty; invalid/duplicate IDs are removed. Complete-catalogue success removes obsolete IDs and retains known IDs, including games hidden by search/genre. Before complete-catalogue success, HTTP `500` and network failures preserve candidate IDs in memory/storage and count; filtered responses cannot remove them. Restore the complete response and verify deferred obsolete-ID removal, retained selections, count, and usable controls. Subsequent failed search/filter requests preserve saved favourites. |
| `REQ-FBK-01` | `TEST-UI-09` | Empty submission identifies each required field and sends no request. |
| `REQ-FBK-02` | `TEST-UI-10`, `TEST-API-02`, `SCN-FBK-02` | Execute EMAIL-01 through EMAIL-27 from the named email table through both UI and API: trimming, allowed characters, local-part dots/empty part, whitespace, `@` count, domain labels/hyphens/characters, and final-label length/letters. Rejected UI values send no request; rejected API values insert no row. Description variants: 19/20 code points, surrounding spaces, whitespace-only, and 19/20 emoji; stored accepted values are trimmed. |
| `REQ-FBK-03` | `TEST-UI-11`, `TEST-API-03` | Success shows confirmation and exactly one matching SQL row. Failure variants: HTTP `500` and an aborted feedback request show an error and preserve selected game, email, and description exactly as entered. |
| `REQ-LAY-01` | `TEST-UI-13`, `SCN-LAY-01` | Desktop variant: 1280 x 800 in Chromium, Firefox, and WebKit. Phone variant: 375 x 812 in Chromium; WebKit phone is optional and its execution is recorded. In each variant, search, filter, catalogue cards, detail content, and feedback controls remain usable without horizontal overflow. Only the desktop suite has mandatory three-browser coverage. |
| `REQ-A11Y-01` | `TEST-UI-12`, `TEST-A11Y-01`, `TEST-A11Y-02`, `SCN-A11Y-01` | Keyboard operation and visible focus; control names; status/error/validation message associations and announcements. Axe scans supplement the manual keyboard and announcement review below. |
| `REQ-DATA-01` | `TEST-DATA-01` | New-database startup: use a nonexistent isolated path without prior reset; verify every seeded game/note field and ID and no feedback. Existing-database startup: change/delete/add games and notes, submit feedback, capture all rows/counter state, stop and restart without reset; verify the captured state is unchanged. Full reset: from a modified isolated database, reset and compare every seeded field/ID, with extra games/notes removed, feedback empty, and next accepted feedback ID `1`. Repeat reset for the same baseline. Failed reset: inject failure after changes begin and before commit; all previous rows and counter state remain unchanged. |
| `REQ-API-01` | `TEST-API-01` | JSON schema, exact seed results, `total`, and normalized `filters`; folded title/code-point ordering and ID ascending when title keys are equal. Ordering fixtures include ASCII case variants and non-ASCII titles. |
| `REQ-API-02` | `TEST-API-01`, `TEST-API-02` | Search/filter AND logic; query decoding and trim; ASCII letters match across case, while the documented `Écho` examples follow literal non-ASCII matching. Trimmed search lengths 80/81, including emoji; genre is exact and untrimmed. |
| `REQ-API-03` | `TEST-API-01`, `TEST-API-02` | Known detail returns the matching game/schema; unknown positive ID without query keys returns `404 NOT_FOUND`; any query key returns `400 INVALID_QUERY` after path validation. |
| `REQ-API-04` | `TEST-API-01`, `TEST-API-02` | Known notes return schema and date/ID descending order; a known game without notes returns `200` with `{ patchNotes: [] }`; unknown game without query keys returns `404 NOT_FOUND`; any query key returns `400 INVALID_QUERY` after path validation. |
| `REQ-API-05` | `TEST-API-02`, `SCN-API-02` | List variants: unsupported/case-mismatched keys, repeated search/genre including empty values, invalid genre, overlong trimmed search, literal punctuation. Detail/notes/feedback variants: known ID or valid body plus `?search=`, `?genre=Action`, `?extra=1`, and repeated keys all return `400 INVALID_QUERY`. Bare `?` is accepted. Malformed/out-of-range path IDs return `400 INVALID_ID`; malformed ID plus query gives `INVALID_ID`, unknown positive ID plus query gives `INVALID_QUERY`, and feedback query errors precede body validation. |
| `REQ-API-06` | `TEST-API-02`, `TEST-API-04` | `400`/`404` have the documented error shape/codes; an isolated dependency failure returns `500 INTERNAL_ERROR` without stack or SQL details. |
| `REQ-API-07` | `TEST-API-02`, `TEST-API-03` | Valid feedback without query keys returns a numeric ID and stores trimmed values. Query keys, malformed JSON, missing/extra fields, wrong types, invalid values, and unknown game IDs return their mapped errors with no new row. Query validation precedes body validation, which precedes unknown-game lookup. |

## Manual scenario links

The procedures, preconditions, expected results, and execution-record fields are in [test-scenarios.md](test-scenarios.md). All scenarios remain planned.

| Requirement(s) | Manual scenario(s) |
| --- | --- |
| `REQ-CAT-01` | `SCN-CAT-01` |
| `REQ-CAT-02`, `REQ-CAT-03` | `SCN-CAT-02`, `SCN-CAT-03` |
| `REQ-CAT-04` | `SCN-CAT-02`, `SCN-CAT-03`, `SCN-CAT-05` |
| `REQ-CAT-05` | `SCN-CAT-02` |
| `REQ-CAT-06` | `SCN-CAT-04` |
| `REQ-DET-01`, `REQ-DET-02` | `SCN-DET-01` |
| `REQ-DET-03`, `REQ-DET-04` | `SCN-DET-02`, `SCN-DET-03` respectively |
| `REQ-FAV-01`, `REQ-FAV-02` | `SCN-FAV-01`, `SCN-FAV-02` |
| `REQ-FBK-01`, `REQ-FBK-02`, `REQ-FBK-03` | `SCN-FBK-01`, `SCN-FBK-02`, `SCN-FBK-03` respectively |
| `REQ-LAY-01`, `REQ-A11Y-01` | `SCN-LAY-01`, `SCN-A11Y-01` respectively |
| `REQ-API-01`, `REQ-API-02`, `REQ-API-03`, `REQ-API-04` | `SCN-API-01`, `SCN-API-02` |
| `REQ-API-05` | `SCN-API-02` |
| `REQ-API-06` | `SCN-API-02`, `SCN-API-03` |
| `REQ-API-07` | `SCN-FBK-02`, `SCN-FBK-03`, `SCN-API-02` |
| `REQ-DATA-01` | `SCN-DATA-01` |

Checks that mutate catalogue/patch notes, verify database startup or reset, or fail a server dependency use the isolated per-test app and database described in the [reset rules](requirements-and-risks.md#database-initialization-and-test-reset). New-database startup skips the setup reset so the database path does not exist at first start. Ordinary feedback submissions use the shared suite database with unique values per test. The versioned seed must meet the [fixture prerequisites](requirements-and-risks.md#seed-fixture-prerequisites) for search, non-ASCII/equal-key title ordering, equal-date notes, and empty notes. Controlled failures are labelled simulations, and their injection/recovery steps must be recorded with execution evidence.

Browser projects and execution gates are defined in [test-plan.md](test-plan.md#browser-and-viewport-coverage). Manual keyboard/focus and screen-reader review supplements axe; it is not replaced by automated scans.
