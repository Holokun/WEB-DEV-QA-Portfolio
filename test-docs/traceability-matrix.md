# Game Companion — Planned Traceability Matrix

Sources: [acceptance criteria and API contract](requirements-and-risks.md) and [test inventory](../PROJECT_PLAN.md). All checks below are **planned**, with no execution result or defect claim. A test ID names an inventory entry; named variants are separate checks under that entry. Smoke runs the primary successful paths of Smoke entries. Validation, failure, recovery, and empty-state variants run in regression.

| Requirement | Planned test(s) | Explicit assertions / variants |
| --- | --- | --- |
| `REQ-CAT-01` | `TEST-UI-01` | Hold the initial response to observe loading; release it and verify every seeded title/genre appears. |
| `REQ-CAT-02` | `TEST-UI-02`, `TEST-UI-04` | Exact/partial and ASCII case search; clearing search retains genre. Boundary variants: 80 code points accepted, 81 show the field message and make no request; include emoji and surrounding spaces. Retained results identify their previous valid search and genre values; first-load invalid input shows no results. Correcting input clears validation and updates results. An older pending response cannot replace retained results after input becomes invalid. |
| `REQ-CAT-03` | `TEST-UI-03`, `TEST-UI-04` | Selected genre includes only matching games; clearing genre keeps the active title search. |
| `REQ-CAT-04` | `TEST-UI-04` | Search and genre use AND logic; changing or clearing either updates the count/results without reload. |
| `REQ-CAT-05` | `TEST-UI-05` | No-match search/filter shows “No games found”; clearing controls restores the catalogue. |
| `REQ-CAT-06` | `TEST-UI-14` | Separate variants for HTTP `500` and an aborted network request: show error and Retry, never empty results. Restore a successful response, click Retry, and verify seeded results load and the error disappears. |
| `REQ-DET-01` | `TEST-UI-06` | Card and detail refer to the same game; title, genre, description, release year, and platforms match; Back returns to the catalogue. |
| `REQ-DET-02` | `TEST-UI-06`, `TEST-API-01` | Follow the patch-note link; dates descend and equal-date notes use ID descending. Empty-notes variant: known game returns `[]` and UI shows its explicit empty message. |
| `REQ-FAV-01` | `TEST-UI-07` | Add/remove changes button state, favourite list, and count immediately. |
| `REQ-FAV-02` | `TEST-UI-08` | Reload preserves valid selections. Storage variants: malformed JSON and non-array JSON recover to empty; an array containing known, obsolete, invalid, and duplicate IDs keeps only distinct valid known IDs. Assert recovered count and usable catalogue controls. |
| `REQ-FBK-01` | `TEST-UI-09` | Empty submission identifies each required field and sends no request. |
| `REQ-FBK-02` | `TEST-UI-10`, `TEST-API-02` | Accepted/rejected email examples, whitespace normalization, description lengths 19/20, and Unicode code-point counting agree between UI and direct API calls. |
| `REQ-FBK-03` | `TEST-UI-11`, `TEST-API-03` | Success shows confirmation and exactly one matching SQL row. Failure variants: HTTP `500` and an aborted feedback request show an error and preserve selected game, email, and description exactly as entered. |
| `REQ-LAY-01` | `TEST-UI-13` | At 375 px and desktop width, catalogue, detail, and feedback controls remain usable with no horizontal overflow. |
| `REQ-A11Y-01` | `TEST-UI-12`, `TEST-A11Y-01`, `TEST-A11Y-02`, `SCN-A11Y-01` | Keyboard operation and visible focus; control names; status/error/validation message associations and announcements. Axe scans supplement the manual keyboard and announcement review below. |
| `REQ-DATA-01` | `TEST-DATA-01` | Isolated database variants: change/delete/add games and notes plus feedback, reset, then compare every seeded field and ID against the seed file. Feedback is empty and the next accepted feedback has ID `1`. Reset again for the same baseline. Inject failure after changes begin and before commit; all previous rows and counter state remain unchanged. |
| `REQ-API-01` | `TEST-API-01` | JSON schema, exact seed results, `total`, and normalized `filters`; folded title/code-point ordering and ID ascending when title keys are equal. Ordering fixtures include ASCII case variants and non-ASCII titles. |
| `REQ-API-02` | `TEST-API-01`, `TEST-API-02` | Search/filter AND logic; query decoding and trim; ASCII letters match across case, while the documented `Écho` examples follow literal non-ASCII matching. Trimmed search lengths 80/81, including emoji; genre is exact and untrimmed. |
| `REQ-API-03` | `TEST-API-01`, `TEST-API-02` | Known detail returns the matching game/schema; unknown positive ID returns `404 NOT_FOUND`. |
| `REQ-API-04` | `TEST-API-01`, `TEST-API-02` | Known notes return schema and date/ID descending order; known game without notes returns `[]`; unknown game returns `404 NOT_FOUND`. |
| `REQ-API-05` | `TEST-API-02` | Unsupported/repeated keys, invalid genre, overlong trimmed search, malformed/out-of-range path IDs are rejected with the mapped `400` error codes. Query punctuation is treated as literal data. |
| `REQ-API-06` | `TEST-API-02`, `TEST-API-04` | `400`/`404` have the documented error shape/codes; an isolated dependency failure returns `500 INTERNAL_ERROR` without stack or SQL details. |
| `REQ-API-07` | `TEST-API-02`, `TEST-API-03` | Valid feedback returns a numeric ID and stores trimmed values. Malformed JSON, missing/extra fields, wrong types, invalid values, and unknown game IDs return their mapped errors with no new row. Check body validation precedes unknown-game lookup. |

Checks that mutate catalogue/notes, reset a database, or fail a server dependency use the isolated per-test app and database described in the [reset rules](requirements-and-risks.md#database-initialization-and-test-reset). Controlled failures are labelled simulations, and their injection/recovery steps must be recorded with execution evidence.

## Planned manual scenario

| Scenario | Procedure and expected result | Status |
| --- | --- | --- |
| `SCN-A11Y-01` | Navigate catalogue, detail, favourites, and feedback with the keyboard; verify visible focus and control names. With a screen reader, trigger loading, no results, API/network error, feedback confirmation, and overlong search; verify useful announcements and the search input's associated validation message. Record the browser and screen reader used. | Planned; not executed |
