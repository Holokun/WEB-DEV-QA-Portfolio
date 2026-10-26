# Review of Vadim's manual session — 2026-10-09

The [original session](testing-session-by-Vadim.md) records a human testing pass. This review compares those notes with the [requirements](../requirements-and-risks.md), [manual procedures](../test-scenarios.md), [version 1 seed](../../app/db/seed.ts), and current [catalogue implementation](../../app/ui/catalogue.ts). It does not independently reproduce the session or turn missing observations into passes.

Status: **Partial manual coverage recorded; combined-search list and 79-character scope clarified; request-truncation suspicion resolved as not reproduced. Boundary coverage and structured reporting follow-up remain.** The [initial notes](evidence/testing-session-by-Vadim-initial.md) are preserved; the current report contains author corrections, supplied evidence and a confirmed manual no-request observation. No application changes, changes to the manual session database, or TestRail result publication were performed. Separate in-memory API and focused Playwright Firefox probes are described below; they do not replace the author's browser observations.

## Recorded environment and results

- Tester: Vadim Lebedev.
- Reported session: 2026-10-09, start 20:16 UTC+04; planned 60 minutes, actual 60 minutes. A separate finish timestamp is not recorded.
- Browser: Firefox 157.0.1, 64-bit; Windows 11 Pro for Workstations, build 26200.
- Viewport: 766 × 577; base URL: `http://127.0.0.1:3000`.
- Commit: `b3b0dc4e12e3aa5a2e6bcafd8d88065ae9b435bd`, with uncommitted changes. The supplied GitHub Desktop screenshot showed 240 changed/new files; this is not a count of 240 new application files.
- Reported database: `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\manual-de812a27fa824044808819c98dafc95d\games.sqlite`; fixture v1. Database contents were not independently inspected in this review.
- The initial notes contain **13 numbered items: 10 marked pass, 2 fail, 1 block**. These are the author's initial labels, not independently verified results or counts of completed canonical SCN scenarios. The 79-character goals are now separated; no new manual pass for 79 characters is inferred.
- After the author's explicit follow-up, Search / 4 records a pass for the supplied 117-character variant; Search / 7 is an unrecorded exact-81 boundary rather than a confirmed failure. The two initial Fail judgments are retained in the snapshot, with their requirement-interpretation correction documented. This does not complete SCN-CAT-03.
- SHA-256 of the preserved initial snapshot: `22e3d25f12e1c2605ffa9ee960bdc82e983550b7f161be429400ff39687404cb`.

## Requirement checks and coverage links

SCN links below identify the related planned procedure. They do not claim completion of its other required variants.

| Original item | Related requirements / procedure | Review finding |
| --- | --- | --- |
| Search / 1 — `0` | REQ-CAT-02, REQ-CAT-05 / SCN-CAT-02 | No seed title contains `0`; the reported empty result is consistent with fixture v1. A title containing a digit would provide additional positive matching coverage. |
| Search / 2 — `1` | REQ-CAT-02, REQ-CAT-05 / SCN-CAT-02 | No seed title contains `1`; the reported empty result is consistent with fixture v1. This does not verify matching a numeric title. |
| Search / 3 — symbols | REQ-CAT-02, REQ-CAT-05 / SCN-CAT-02 | Exact input is missing. The assertion that game titles cannot contain symbols is unsupported by the requirements; matching is literal. The empty result needs the exact query and active genre to be reproducible. |
| Search / 4 — maximum length | REQ-CAT-02 / SCN-CAT-03 | Corrected expectation: full overlong input is allowed with validation and no request. The screenshot supports the message; the author subsequently confirmed whole-value insertion of 117 characters with no request. The observed variant is recorded Passed; no truncation defect is established. |
| Search / 5 — 79 characters | REQ-CAT-02 / SCN-CAT-03, additional boundary idea | The author agreed to separate acceptance from positive matching, and the source now records 5A/5B. Positive matching remains blocked by missing matching data; manual query acceptance is not separately recorded. A separate automated probe verified acceptance of a 79-character sample with HTTP 200 and zero matches. |
| Search / 6 — another alphabet | REQ-CAT-02 / SCN-CAT-02 | Exact query is missing. There is no general language ban, and fixture v1 already contains `Écho`. The expected result depends on the literal query. |
| Search / 7 — 81 characters | REQ-CAT-02 / SCN-CAT-03 | Corrected expected behavior and marked unrecorded for exact-81 input. The confirmed no-request sample has 117 code points; it does not establish a separately executed exact-81 manual boundary. |
| Genre / 1 | REQ-CAT-03 / SCN-CAT-02 | Action, Racing and Strategy were reported checked. Adventure, Puzzle and RPG are not recorded here; exact expected/actual titles or IDs and counts are missing. Multiple genres per game are outside the current single-genre contract. |
| Clear controls / 1 | REQ-CAT-05 / SCN-CAT-02 | Both controls clearing and a GET 200 are reported. Record the starting search, expected 10 seeded games after clearing, and actual count/IDs. This does not cover clearing only one control while retaining the other. |
| Combined search / 1 | REQ-CAT-02, REQ-CAT-04 / SCN-CAT-02 | Resolved as a documentation error: the author explicitly requested removal of standalone `A`. The corrected `At` / `Atl` / `Atla` / `Atlas` variants match only ID 10, consistent with the reported result. No failure of `A` is claimed. Response-order variants remain unrecorded. |
| Game card / 1 | REQ-DET-01 / SCN-DET-01 | Detail fields and GET 200 are reported; the selected game name/ID and compared field values are missing. |
| Game card / 2 | REQ-DET-02 / SCN-DET-01 | Empty notes with GET 200 are reported, but the game ID is missing. Fixture v1 has notes for IDs 1 and 6; ID 9 is a known empty-notes example. Note ordering was not recorded. |
| Back / 1 | REQ-DET-01 / SCN-DET-01 | Return to the catalogue with reset controls and GET 200 is reported. This does not establish browser Back/Forward or persisted page lifecycle coverage. |

## Disposition of the initial Fail labels

REQ-CAT-02 and the UI-specific explanation in the requirements expressly allow entering or pasting an overlong value. For more than 80 Unicode code points **after trimming**, the UI must show `Search must be 80 characters or fewer`, mark the field invalid, send no catalogue request, and retain previous successful results and their labels. Correcting the input must resume requests using the current genre.

The current source applies this validation before constructing a request and contains no `maxlength` input cap. This source inspection explains the intended behavior; it does not prove the exact behavior Vadim saw in Firefox.

“No API request longer than 80 characters” can describe a previously sent valid request. The exact later sample contains 117 code points; the copied query contains 80 and equals its first 80. The screenshot supports validation, and the author confirmed no request after whole-value insertion. Search / 4 is corrected to Passed for that recorded sample; Search / 7 remains unrecorded for exactly 81. Full manual scenarios are not relabelled Passed. The truncation suspicion is resolved as not reproduced and consistent with intermediate request history.

## Combined-search reference check

A Node.js probe imported the built `createSchema`, `insertSeed`, and `handleGames` functions, created a SQLite `:memory:` database, loaded fixture v1, and called the handler for five search queries with genre Strategy. All handler results had status 200:

| Search | Expected and observed handler IDs / titles | Total |
| --- | --- | --- |
| `A` | 10 — Atlas Tactics; 4 — Zeta | 2 |
| `At` | 10 — Atlas Tactics | 1 |
| `Atl` | 10 — Atlas Tactics | 1 |
| `Atla` | 10 — Atlas Tactics | 1 |
| `Atlas` | 10 — Atlas Tactics | 1 |

These are reference results from a fresh isolated fixture, not additional manual passes, HTTP-server/browser checks, or a read of the session database. The author subsequently clarified that Latin `A` was a mistaken entry in the report and asked to remove it. Its reference result above remains explanatory, outside the corrected manual query list.

## Supplied screenshot and focused request diagnostic

The [user's screenshot](evidence/search-limit-vadim.png) establishes visible overlong-input validation and retained results. The request list is historical: it does not identify a request caused by the final 117-character input. The author asked to exclude red request statuses from this investigation; their cause is not asserted.

A fresh build passed. One focused diagnostic script launched the ordinary app against its own fixture v1 database and Playwright Firefox **155.0**, with a fresh context per insertion mode. Its [native JSON output](evidence/search-limit-diagnostic.json) records the exact supplied input, copied query, request values, browser and ownership:

| Diagnostic action | Observed result |
| --- | --- |
| Sequentially enter the supplied 117-character value | 80 requests, carrying prefixes of lengths 1 through 80. The last equals the user's copied query; no request exceeds 80. Full field value and validation remain. |
| Insert the entire 117-character value in one action | Zero search requests; full input remains; documented message and invalid field state appear. |
| Correct to the first 79, then 80 characters | Each returns HTTP 200, echoes the complete search, reports zero matching games, and clears validation. |

All diagnostic assertions passed and the owned browser/app were closed. This was not the 66-case suite, a new execution by Vadim, or a reproduction in his Firefox 157.0.1 environment. No request trimming/truncation was reproduced. The supplied 80-character URL is consistent with an earlier sequential-input request; its exact historical timestamp is not known.

The author subsequently reported **«Вставил строку из 117 символов запроса не было»** after the focused manual-check instructions. This is recorded as his no-request observation in the existing Firefox 157.0.1 session context, with no new screenshot/HAR or exact time supplied. Together with the earlier validation screenshot, it supports the recorded 117-character behavior and resolves the truncation suspicion; it does not establish every boundary or recovery variant.

## Targeted follow-up

1. Start with valid visible results, for example `Ember` with All genres (IDs 6 and 5).
2. Check explicit ASCII inputs such as `'a'.repeat(79)` and `'a'.repeat(80)`: the full trimmed query is accepted, no length validation appears, and the new request returns HTTP 200 with no matching seed games.
3. The 117-character no-request follow-up is now recorded. Check an explicit 81-character value separately to cover that manual boundary. Additional emoji, trimming, invalid-genre-change and pending-response variants are separate required checks in SCN-CAT-03.
4. Record the exact symbol/non-ASCII queries and the selected game IDs from the original pass if still known. If they were not recorded, state that and use a new dated check. Fixture examples: `ÉCH` matches Écho (ID 3); `éch` and `echo` do not match it under the ASCII-only folding rule.
5. The combined query list is corrected to `At` / `Atl` / `Atla` / `Atlas`; retain the author's observation and record per-input IDs/evidence where available. No retest of standalone `A` is needed to resolve that documentation mistake.
6. Compare Orbit (ID 1) notes in version order `1.1.1`, `1.1.0`, `1.0.0`; compare Moss Garden (ID 9) with its empty notes response. Record actual URLs, IDs, content and evidence.

If the validation message is missing or an invalid new request is sent, investigate that observed mismatch with reproducible steps and evidence before opening a BUG record. Do not change the input cap just to match the original expectation.

## Remaining reporting and exploration work

- The source now has a session title and one scripted follow-up row, but retains Work in progress status, a placeholder charter, an empty timed/tagged log, and an empty debrief. Its Notes section supplies useful manual observations and test ideas, but does not establish a completed structured exploratory session.
- Link performed variants to their SCN/REQ IDs, retain original observations, correct requirement interpretations, and distinguish recorded passes from pending clarification. Do not invent exact inputs, request contents, timestamps or evidence retrospectively.
- For retrospective notes, label them as retrospective; if a time or input is unknown, say it was not recorded. Summarize covered/partial/unexplored areas and what was learned in the author's own words.
- One author-supplied screenshot and exact input/query are now linked for overlong-input validation. Evidence for other reported checks remains unlinked; attach available responses/screenshots and identify what each supports. The automated diagnostic output is labelled separately.
- The recorded 766 × 577 viewport does not cover the required 1280 × 800 desktop or 375 × 812 phone variants. Keyboard/focus, screen-reader checks, loading/failure/Retry, request races and ordered notes remain unrecorded.
- OBS-FF-01 lifecycle warnings were not investigated in these notes; their reproduction, cause and user-visible impact remain open. This Firefox 157.0.1 session is distinct from the earlier Playwright Firefox 155.0 run.

The manual/exploratory completion gate remains open. Partial human coverage, supplied validation evidence, a confirmed whole-value no-request observation and a focused diagnostic are recorded; full required scenario coverage and structured exploration reporting remain incomplete. This follow-up did not execute a network-failure simulation.
