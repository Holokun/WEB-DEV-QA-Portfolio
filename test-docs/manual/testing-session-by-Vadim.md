# Game Companion — Vadim's manual session and follow-up

Status: **Report documented on 2026-10-12; first-slice coverage is partial.** The human observations below are Vadim's. The additional [17 check groups](follow-up-2026-10-12.md) were executed separately by Codex using Playwright and inspected screenshots. Their latest results all pass; they are not additional manual executions by Vadim.

The report covers catalogue search/filter, game details and patch notes. Full manual scenarios, accessibility and portfolio release gates remain open.

## Session purpose

Explore catalogue search/filter and game detail/patch-note navigation with Firefox, browser Network tools and fixture v1 to discover mismatches between visible results, request data and the written requirements.

This charter and debrief were written retrospectively from available notes, author corrections and follow-up results. They are not presented as a charter or timed log written before the original session. Reference oracles: [requirements](../requirements-and-risks.md), [manual scenarios](../test-scenarios.md) and [literal fixture expectations](../../tests/fixtures/expected-data.ts).

The main questions were whether combined controls use AND matching, search limits are explained without silently trimming input, navigation shows the correct data, and failures can be distinguished from valid empty results.

## Human session environment

| Field | Recorded value |
| --- | --- |
| Tester | Vadim Lebedev |
| Date and start | 2026-10-09, 20:16 UTC+04, Asia/Yerevan |
| Planned / actual duration | 60 / 60 minutes, reported by the tester; finish timestamp not recorded |
| Browser | Mozilla Firefox 157.0.1, 64-bit |
| OS | Windows 11 Pro for Workstations, 10.0.26200, build 26200 |
| Viewport | 766 × 577 |
| Base URL | `http://127.0.0.1:3000` |
| Commit | `b3b0dc4e12e3aa5a2e6bcafd8d88065ae9b435bd` |
| Working tree | GitHub Desktop showed 240 changed/new files at setup; this is not a count of new application files |
| Fixture | v1, ten synthetic games |
| DB_PATH | `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\manual-de812a27fa824044808819c98dafc95d\games.sqlite` |

The original database was not opened or reset during the assistant follow-up. Later human confirmations have no separately recorded execution time or freshly confirmed environment.

## Recorded human checks

Each row describes the observed portion of a planned scenario. A passing row does not complete every SCN variant. Missing inputs remain missing.

| Original check / SCN | Input or action | Expected | Recorded actual result | Disposition / evidence |
| --- | --- | --- | --- | --- |
| Search 1 and 2 / SCN-CAT-02; REQ-CAT-02, REQ-CAT-05 | `0` and `1` | Literal matching; empty if no title matches | Both displayed No games found | Reported Passed. No seed title contains those digits; positive numeric-title matching was not tested. |
| Search 3 / SCN-CAT-02; REQ-CAT-02, REQ-CAT-05 | Symbols; exact query and genre not recorded | Match the literal query against titles | No games found | Tester marked Passed, but exact variant is not reproducible. No requirement bans symbols in titles. New `<>&` check: FOLLOWUP-08. |
| Search 4 / SCN-CAT-03; REQ-CAT-02 | Insert complete 117-code-point sample below | Retain full input, validation, no new request | Screenshot shows validation; author confirmed: «Вставил строку из 117 символов запроса не было» | Passed for no-request observation. [Screenshot](evidence/search-limit-vadim.png); no new HAR or exact follow-up time. |
| Search 5A / SCN-CAT-03; REQ-CAT-02 | Accept 79-code-point query | HTTP 200 can return no matches | Not separately recorded by Vadim | Human variant not recorded; separate FOLLOWUP-02 passed. |
| Search 5B / additional data idea; REQ-CAT-02 | Find matching 79-character title | Matching game appears | Fixture v1 lacks such a title | Blocked for this positive-match idea only; query acceptance is not blocked. |
| Search 6 / SCN-CAT-02; REQ-CAT-02 | Another alphabet; exact query unknown | Literal matching with documented ASCII folding | No games found | Tester marked Passed; exact input missing. No general language ban; seed includes Écho. New Unicode variants: FOLLOWUP-08. |
| Search 7 / SCN-CAT-03; REQ-CAT-02 | Exactly 81 code points | Full value, validation, no request, retained results | Original supplied sample was 117, not 81 | Exact-81 human variant not recorded; separate ASCII/emoji FOLLOWUP-06/07 passed. |
| Genre / SCN-CAT-02; REQ-CAT-03 | Action, Racing, Strategy | Cards match chosen genre | Three named genres reported correct | Reported Passed; original titles/counts not captured. All six exact ID sets now checked in FOLLOWUP-09. |
| Clear controls / SCN-CAT-02; REQ-CAT-02–05 | Clear search and Action | Empty search, All genres, catalogue request | Controls cleared; GET 200 | Reported Passed; starting query/count missing. New independent clearing checks: FOLLOWUP-10. |
| Combined / SCN-CAT-02; REQ-CAT-02, REQ-CAT-04 | Strategy + `At`, `Atl`, `Atla`, `Atlas` | Only Atlas Tactics | Only Atlas Tactics reported | Reported Passed. Standalone `A` removed as author-confirmed documentation mistake. Per-input responses: FOLLOWUP-10. |
| Game card / SCN-DET-01; REQ-DET-01 | Open game | Matching description, release/platform fields, notes link | Detail/fields correct; GET 200 reported | Reported Passed; selected ID/compared values missing. Exact Orbit check: FOLLOWUP-11. |
| Empty notes / SCN-DET-01; REQ-DET-02 | Open selected game's notes | Known no-notes game: HTTP 200 and explicit empty message | No patch notes available; GET 200 | Reported Passed; original ID unknown. New Moss Garden ID 9 check: FOLLOWUP-12. |
| Back / SCN-DET-01; REQ-DET-01 | Return to catalogue | Catalogue with reset controls | Correct page/reset controls; GET 200 | Reported Passed. Browser Back/Forward and persisted lifecycle not established. |
| Network recovery / SCN-CAT-04 network portion; REQ-CAT-06 | Network loss → error → restore → Retry | Distinct failure message and recovery | Author confirmed on 2026-10-12 that the proposed flow worked | Passed, human-reported for described portion. [SIM-CAT-01](../../bug-reports/SIM-CAT-01-network-recovery.md); exact mechanism, inputs, execution date and captures absent. |

The [initial notes](evidence/testing-session-by-Vadim-initial.md) contain 13 numbered items with 10 Pass, 2 Fail and 1 Block labels. Both Fail judgments assumed an input cap the requirements do not specify. They were withdrawn as interpretation errors, not repaired product defects. These labels are not counts of completed canonical scenarios.

## Search-length investigation

Vadim's full input: **117 Unicode code points**, no surrounding whitespace:

```text
фывшйгцвнщйшцгнвщйцвнйцвнйц8в76йц978631923619316с3716237812с3761273ис619с3692ис3692с3692с6392с6392ис6931с2691с2639172
```

Copied request URL:

```text
http://127.0.0.1:3000/api/games?search=фывшйгцвнщйшцгнвщйцвнйцвнйц8в76йц978631923619316с3716237812с3761273ис619с3692ис3
```

The query is exactly the first 80 code points. An [earlier separate Firefox 155 diagnostic](evidence/search-limit-diagnostic.json) observed typed prefixes of lengths 1–80, no request above 80 and zero search requests on whole-value insertion. Vadim subsequently confirmed the no-request result in his own session context.

Truncation was not reproduced. The URL is consistent with an intermediate typing request; its historical timestamp is unknown. The image supports validation and retained results but cannot identify the final event's request timing. Red request statuses and the possible closed PowerShell were excluded at the author's request; their cause is not asserted.

## Session log and follow-up observations

Human entries are retrospective summaries. Per-action times were not recorded; the row order is not an invented minute-by-minute timeline. Separate assistant native logs have exact UTC times.

| Time / source | Action | Observation | Tag | Evidence / follow-up |
| --- | --- | --- | --- | --- |
| 2026-10-09, within reported session; action time unknown / Vadim | Search/filter, detail/notes and Back | Useful functional observations; some exact inputs and IDs absent | NOTE | Human table and snapshots |
| Human follow-up; exact time unknown / Vadim | Remove `A`; separate 79-character goals | Documentation corrected; missing long title does not block query acceptance | NOTE | [Pre-polish report](evidence/testing-session-by-Vadim-before-polish-2026-10-12.md) |
| Human follow-up; exact time unknown / Vadim | Insert full 117-character sample | No new request; earlier screenshot separately shows validation | NOTE | Screenshot and confirmation |
| 2026-10-12 confirmation; execution time unknown / Vadim | Confirm network-recovery check | Proposed flow reported working; precise mechanism and captures missing | NOTE | SIM-CAT-01 |
| 2026-10-12, 14:58:40.925–14:59:00.077 UTC+04 / Codex | First 17 follow-up groups | 16 passed; Chromium keyboard group stopped at native-select key-sequence assumption | QUESTION | [First run](evidence/follow-up-2026-10-12/first-run/results.json) |
| 2026-10-12, assistant follow-up / Codex | Compare select key sequences | Home → ArrowDown → Tab reaches Clear controls in both browsers; extra Enter changes Chromium behavior | NOTE | [Keyboard probe](evidence/follow-up-2026-10-12/keyboard-select-probe.json) |
| 2026-10-12, 15:01:07.971–15:01:11.429 UTC+04 / Codex | Rerun only two keyboard groups | Both passed; no application change | NOTE | [Keyboard run](evidence/follow-up-2026-10-12/keyboard-run/results.json) |
| 2026-10-12 / Codex | Inspect seven selected screenshots | Readable labels/content, visible focus, phone stacking; no visible overlap in inspected states | NOTE | [Visual review](follow-up-2026-10-12.md#visual-review) |

## Debrief

**Covered:** Vadim's functional observations, confirmed 117-character no-request variant and reported network-recovery flow. Separate assistant checks add evidenced 79/80/81 boundaries, emoji/trim, invalid-input genre deferral/recovery, exact matching data, six genres, independent clearing, Orbit fields/ordered notes, Moss Garden empty notes, Firefox/Chromium keyboard and three viewport combinations.

**Partially explored:** SCN-CAT-03 invalid-search, SCN-CAT-04 recovery, SCN-A11Y-01 access and SCN-LAY-01 layout. Executed portions have evidence or stated human attribution; remaining variants are listed in the [coverage review](testing-session-by-Vadim-review.md).

**Unexplored here:** screen-reader announcements, axe, HTTP 500 variants, failure/Retry by keyboard, pending/overlapping response variants, full browser matrix and physical devices. Favourites/feedback are outside the slice. Positive matching of a 79-character title lacks fixture data. Original unspecified symbol/alphabet inputs cannot be recovered.

**Defects and simulations:** no application defect confirmed in this work. Two initial Fail judgments were interpretation errors. One assistant harness failure was diagnosed/corrected. SIM-CAT-01 is a human-reported connectivity simulation, not a discovered defect; the assistant did not repeat it.

**What was learned:** query acceptance and finding a matching title are distinct tests. Length is counted after trim in Unicode code points; an emoji is one. An 80-character request can precede a later invalid input. ASCII folding does not imply accent removal/general Unicode folding. Native select key sequences need validation in the actual browser.

**Outcome and hand-off:** requested reporting and selected follow-up checks are complete. This is a documented first-slice hand-off; wider manual/automation/release gates remain open. Development can proceed to favourites and feedback while remaining coverage is tracked explicitly.

## Evidence and provenance

- [Initial notes](evidence/testing-session-by-Vadim-initial.md), unchanged SHA-256: `22e3d25f12e1c2605ffa9ee960bdc82e983550b7f161be429400ff39687404cb`.
- [Clarified report before polishing](evidence/testing-session-by-Vadim-before-polish-2026-10-12.md), SHA-256: `4ca60d3d12ec7f4fd2cc1a0b2292826e104e5bd6b6c6d863e4acbb9298f7085e`.
- [Previous requirements review](evidence/testing-session-by-Vadim-review-before-polish-2026-10-12.md).
- [Assistant follow-up](follow-up-2026-10-12.md): native responses, screenshots, source hashes and reproduction commands.
- [Network-recovery report](../../bug-reports/SIM-CAT-01-network-recovery.md): Vadim's confirmation.

No application or existing test-suite code was changed, no manual-session database was reset, and no TestRail results were published in this follow-up.
