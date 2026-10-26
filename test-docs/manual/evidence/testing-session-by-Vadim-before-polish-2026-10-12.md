# Manual / exploratory session — Vadim Lebedev

Status: Work in progress. 

- Tester: Vadim Lebedev
- Date/time/timezone: 2026-10-09 +4 UTC START 8:16 PM
- Browser/version: Mozila Firefox 157.0.1 (64-bit)
- OS/version: Windows 11 Pro for Workstations 10.0.26200 Build 26200
- Viewport: 766 × 577
- Base URL: http://127.0.0.1:3000
- Commit and uncommitted changes: b3b0dc4e12e3aa5a2e6bcafd8d88065ae9b435bd and 240 changed/new files shown in GitHub Desktop at session setup
- DB_PATH: "D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\manual-de812a27fa824044808819c98dafc95d\games.sqlite"
* fixture version: v1
- Planned / actual duration: 60 min / 60 min

## Scripted manual checks

Record one row per executed scenario variant; leave unexecuted variants unexecuted.

| SCN ID / variant | Preconditions / exact input and steps | Expected | Actual | Result | Evidence / BUG / SIM |
| ---------------- | ------------------------------------- | -------- | ------ | ------ | -------------------- |
| SCN-CAT-03 / additional 117-character no-request variant; REQ-CAT-02 | Insert the exact 117-character sample below in one action | No new catalogue request | Vadim reported: «Вставил строку из 117 символов запроса не было» | Passed for the no-request assertion | Author's follow-up in chat; exact time and a new Network capture not recorded. Earlier screenshot separately supports visible validation. |

## Exploratory charter

Explore [specific target] with [tools / data / conditions] to discover [information].

## Session log

| Time | Action / exact input | Observation | Tag (NOTE / QUESTION / RISK / BUG / IDEA) | Evidence / follow-up |
| --- | --- | --- | --- | --- |
| | | | | |

## Debrief

- Covered:
- Partially explored:
- Unexplored / reason:
- Reproducible defects / expected vs actual / exact reproduction steps:
- Unconfirmed observations:
- Simulated conditions and injection method:
- What was learned:
- Next investigation / test ideas:


***
# Notes:

## Search games: 
Test cases:
### 1 test case
Check the field on ==0==

expected result: show games with 0 in name
actual result: in this version No games found, because we don't have any game with 0 in name
pass
comm: we need a test game with 0 in name
### 2 test case
Check the field on ==1==

expected result: show games with 1 in name
actual result: in this version No games found, because we don't have any game with 1 in name
pass
comm: we need a test game with 1 in name
### 3 test case
Check the filed on symbols 

expected result: 0 games found, platform doesn't allow to place a game with symbols in name
actual result: No games found
pass
### 4 test case
Overlong search — supplied 117-character sample (reviewed expectation and follow-up)

expected result: the full overlong value can remain in the field; show "Search must be 80 characters or fewer" and send no new catalogue request.
actual result: the supplied screenshot shows the validation message, and Vadim subsequently reported inserting the whole 117-character value with no request. The exact sample is recorded below.
pass
comm: Passed for the described 117-character variant. The initial input-cap expectation and Fail judgment are preserved in the initial snapshot. This does not complete every SCN-CAT-03 variant.


### 5 test case
Search with 79 characters — two distinct checks (clarified by the author after review)

#### 5A — Acceptance of a 79-character query

expected result: the query is accepted without length validation; a new request returns HTTP 200. Zero matches are valid when no seed title matches.
actual result: the original note does not separately record this validation/network check in the manual browser.
not executed / not separately recorded

#### 5B — Positive matching of an existing 79-character title

expected result: find a game whose actual title matches the supplied 79-character search.
actual result: Blocked for this positive-match check because fixture v1 has no 79-character title.
block
comm: a matching 79-character title would be needed for 5B. Its absence does not block 5A. The separate automated follow-up below is not a manual pass for 5A.

### 6 test case
Use another alphabet

expected result: No games found
actual result: No games found
pass
comm: we don't post a game in another language

### 7 test case
Exactly 81 characters in field — separate boundary variant

expected result: retain all 81 characters, show the documented validation, send no new catalogue request, and retain previous successful results.
actual result: no exact-81 manual input/result was separately recorded. The supplied and subsequently checked sample contains 117 characters.
not executed / not separately recorded
comm: The original duplicate input-cap Fail judgment is withdrawn as a requirement-interpretation error. A passing 117-character variant does not establish an exact-81 manual execution.


## Genre 
Test cases: 

### 1 test case
Genre match with game card

expected result: Chosen genre was show in results for search all games with this genre
actual result:  Action✅, Racing.✅, Strategy✅
pass
comm: We don't have any games with two or more genres, for next version we need to add more test cards

## Clear controls 
Test cases:

### 1 test case
Click on clear games send /api/games

expected result: filed "Search games" and picked "Genre" go to clear filed and all genres
actual result: request was sent, response was correct. Field after click on Clear controls become clear and genre become Action -> All genres GET 200
pass

## Combined Search games and Genre
Test cases:

### 1 test case
Search with Genre working on AND logic

expected result: Genre: Strategy with Search request: "At/Atl/Atla/Atlas", show only "Atlas Tactics", without "Zeta". Don't show games with name "Atlas" or in genre strategy
actual result: showed only "Atlas Tactics"
pass

## Game card
Test cases:

### 1 test case
The Click on card send request  api/games/id

expected result: open game card with his description and patch notes
actual result: page was opened, description, link on patch notes, and other require fields  showed GET 200
pass

### 2 test case
The Click on patch notes send request  api/games/id/patch-notes

expected result: game cards patch notes with his description 
actual result: in description of patch notes "No patch notes available" GET 200
pass

## Back
Test cases:

### 1 test case 
/api/games

expected result: back to main page with clear field Search games and default Genre
actual result: Page loaded correct, conditions observed GET 200
pass

## Clarifications and supplied evidence after review

The [initial snapshot](evidence/testing-session-by-Vadim-initial.md) preserves the original observations and judgments. The current report incorporates the author's `A` removal, 79-character test separation, and later no-request observation for the exact 117-character sample. The initial length-related Fail judgments came from an input-cap expectation that conflicts with REQ-CAT-02; they do not establish product defects. See the [review and disposition](testing-session-by-Vadim-review.md).

- The author clarified that standalone `A` was a documentation mistake in the combined search list. The intended recorded values are `At`, `Atl`, `Atla`, and `Atlas`.
- The author agreed that the 79-character note combined acceptance of a query with positive matching of an existing title; those goals are separated above.
- The author supplied an [actual Firefox screenshot](evidence/search-limit-vadim.png), the full field value below, and a copied request URL. The screenshot shows `Search must be 80 characters or fewer`, a red field outline, retained `10 games`, and a Network history containing 81 requests. The screenshot alone does not establish which request followed the final input event.
- The author suspected closing PowerShell caused the red request entries and asked to leave those statuses out of the current investigation. Their cause has not been established here.

Full field value supplied by the author — **117 Unicode code points**, with no surrounding whitespace:

```text
фывшйгцвнщйшцгнвщйцвнйцвнйц8в76йц978631923619316с3716237812с3761273ис619с3692ис3692с3692с6392с6392ис6931с2691с2639172
```

Copied request URL supplied by the author:

```text
http://127.0.0.1:3000/api/games?search=фывшйгцвнщйшцгнвщйцвнйцвнйц8в76йц978631923619316с3716237812с3761273ис619с3692ис3
```

The request's search value is exactly **80 code points** and matches the first 80 code points of the full input. This may be the earlier request sent during sequential typing, rather than a new request that truncated 117 characters. The original manual request timing is not recorded.

A separate focused automated diagnostic used **Playwright Firefox 155.0**, its own local app/database and this exact sample. Its [recorded output](evidence/search-limit-diagnostic.json) shows:

- Sequential typing: 80 search requests, with lengths 1 through 80; the last query matches the copied 80-character prefix. No request exceeded 80.
- Whole-value insertion of all 117 characters in a fresh page: no search request; the full field value remained and validation appeared.
- Correction to 79 and 80 characters: HTTP 200, full search echoed in `filters.search`, zero matching games, no length validation.

These automated observations do not replace the author's Firefox 157.0.1 results. Request truncation was not reproduced in the diagnostic.

### Manual follow-up confirmed by the author

After being instructed to load the catalogue with a running server, clear Network and insert the whole value, Vadim replied: **«Вставил строку из 117 символов запроса не было»**. This records a passing no-request observation for the supplied 117-character variant in his manual session context. A new screenshot/HAR and exact follow-up time were not supplied; the earlier image separately establishes visible validation.

The suspicion that the application truncates the overlong value into a new 80-character request is resolved as not reproduced. The earlier copied 80-character URL is consistent with an intermediate typing request, as reproduced by the separate diagnostic; the exact historical request timestamp remains unknown. Exactly 81 characters, manual acceptance of 79/80 characters, and other SCN-CAT-03 variants remain separate coverage.
