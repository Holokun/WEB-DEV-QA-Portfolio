# New features: independent structured automated agent QA — 2026-10-27

## Charter recorded before execution

Tester: Codex GPT-6 agent, independent data-check worker. This is structured automated agent QA using new temporary Playwright/Node instrumentation, not a human manual session, exploratory testing session, or native assistive-technology test. It supplements the separately recorded agent session and existing regression suite.

Scope: SCN-FAV-01/02 and SCN-FBK-01/02/03. Independently transcribe all 27 named email expectations and seven fixed description inputs from `test-docs/requirements-and-risks.md`; do not import product validators or existing regression oracles. Check raw-field preservation during simulated HTTP 500/network abort, required/partial forms, malformed/schema-invalid bodies, unknown-game and validation precedence. For every accepted submission, verify returned positive safe ID, exactly one additional row, and exact trimmed fields in that ID's row from the same absolute DB. Rejections must leave all rows unchanged; UI rejections send no POST.

Environment contract: Windows, installed Node/Playwright, headless Chromium 1280×800, one serial owned app, automatically allocated available port, unique absolute SQLite path under ignored `test-results/sdd/portfolio-completion-2026-10-26/task-3-data/`. Product source `94779ebd20c08e763ec0c99cae4aa0dbb4238af7`; compile into owned ignored build and copy unchanged HTML/CSS. No user database reset, product/source edits, dependency changes, native app/profile/settings changes, or publication. Temporary artifacts are evidence only and are not production launch dependencies.

Evidence: pre-execution timestamp and hashes in `environment.json`; per-variant exact inputs/expected/actual/SQL/request records in `results.json`; raw network/console logs, Playwright trace and screenshots; native run output and SHA-256 manifest. Synthetic data only. Failure injections are labelled simulations and not app defects.

Limits: this scope cannot establish real screen-reader speech or complete Task 3. Native Narrator launch was rejected by the tool in the separate session, and Firefox native pairing is unsupported by tool policy; that acceptance gate remains pending. Existing regression counts and axe scans do not substitute for these new checks or native AT.

## Execution results

Original execution: **120/120 functional PASS**, with a test-data convention deviation in the two recovery variants (see focused correction below). Final coverage of these **120 structured scenarios** is supported by **118 original conforming cases plus two corrected focused cases across separate runs**. There were **122 completed scenario executions historically**, excluding the interrupted harness attempt. No product defects were observed in this bounded scope. Actual UTC interval **2026-10-27T06:23:46.708Z–2026-10-27T06:23:56.805Z** (Asia/Yerevan UTC+4). Windows, Node **v24.22.1**, Playwright **1.63.0**, headless Chromium **153.0.8010.12**, **1280×800**; base URL **http://127.0.0.1:54145**. Absolute owned DB: `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\sdd\portfolio-completion-2026-10-26\task-3-data\structured-run2.sqlite`. Product source and all source/build hashes: [environment.json](evidence/new-features-structured-2026-10-27/environment.json). Product app diff against the recorded commit was empty. The temporary server and browser were stopped after execution.

| Checks | Executions | Result |
| --- | ---: | --- |
| Rendered UI reconnaissance and observed labels | 1 | PASS |
| EMAIL-01 through EMAIL-27, each UI + API | 54 | PASS |
| Seven fixed description inputs, each UI + API | 14 | PASS |
| Empty and six partial required-field combinations | 7 | PASS |
| Additional real valid UI submission | 1 | PASS |
| Original simulated HTTP 500 and abort, raw preservation and real retry | 2 | Functional PASS; duplicate nonboundary description; corrected below |
| Malformed/schema/type/range bodies and invalid-before-unknown lookup | 28 | PASS |
| Valid unknown game and upper safe-ID unknown | 2 | PASS (404) |
| Query-before-malformed-body precedence | 1 | PASS (400 INVALID_QUERY) |
| Favourite add/remove/reload, malformed + four wrong shapes, mixed and held/full failure variants | 10 | PASS |

The original 19 real accepted POSTs (10 email, six fixed-description, one additional valid, two real recoveries) each returned a positive safe numeric ID, inserted exactly one row, and matched the exact trimmed game/email/description selected by that returned ID. SQL count and row snapshots are retained per case. Every rejected UI variant sent zero POSTs; every rejected direct request had the required error status/code with unchanged SQL rows. Fixed description values were used without suffixes; uppercase email characters were preserved. Required-field errors were associated by aria-describedby/aria-invalid and all raw entered values remained available.

| Variant | Expected | UI | API |
| --- | --- | --- | --- |
| EMAIL-01 | Accept | PASS | PASS |
| EMAIL-02 | Accept | PASS | PASS |
| EMAIL-03 | Accept | PASS | PASS |
| EMAIL-04 | Accept | PASS | PASS |
| EMAIL-05 | Accept | PASS | PASS |
| EMAIL-06 | Reject | PASS | PASS |
| EMAIL-07 | Reject | PASS | PASS |
| EMAIL-08 | Reject | PASS | PASS |
| EMAIL-09 | Reject | PASS | PASS |
| EMAIL-10 | Reject | PASS | PASS |
| EMAIL-11 | Reject | PASS | PASS |
| EMAIL-12 | Reject | PASS | PASS |
| EMAIL-13 | Reject | PASS | PASS |
| EMAIL-14 | Reject | PASS | PASS |
| EMAIL-15 | Reject | PASS | PASS |
| EMAIL-16 | Reject | PASS | PASS |
| EMAIL-17 | Reject | PASS | PASS |
| EMAIL-18 | Reject | PASS | PASS |
| EMAIL-19 | Reject | PASS | PASS |
| EMAIL-20 | Reject | PASS | PASS |
| EMAIL-21 | Reject | PASS | PASS |
| EMAIL-22 | Reject | PASS | PASS |
| EMAIL-23 | Reject | PASS | PASS |
| EMAIL-24 | Reject | PASS | PASS |
| EMAIL-25 | Reject | PASS | PASS |
| EMAIL-26 | Reject | PASS | PASS |
| EMAIL-27 | Reject | PASS | PASS |
| DESC-01: empty | Reject | PASS | PASS |
| DESC-02: three spaces | Reject | PASS | PASS |
| DESC-03: 19 ASCII characters | Reject | PASS | PASS |
| DESC-04: 20 ASCII characters | Accept | PASS | PASS |
| DESC-05: 20 ASCII plus surrounding spaces | Accept | PASS | PASS |
| DESC-06: 19 🎮 | Reject | PASS | PASS |
| DESC-07: 20 🎮 | Accept | PASS | PASS |

SCN-FAV-01: adding Orbit updated the count/list immediately, persisted on reload; removing and reloading retained the empty state. SCN-FAV-02: malformed JSON, object, null, string and number storage recovered to a usable empty list. Mixed input `[1,1,6,0,-1,1.5,"2",9007199254740992,null,true,{},99999]` normalized to candidates `[1,6,99999]`. Held complete request, simulated complete HTTP 500 and complete abort each retained those candidates while Action filtering showed only IDs `[8,1]`; known hidden game 6 and obsolete candidate 99999 remained. Successful full recovery produced `[1,6]`; a later simulated filtered HTTP 500 retained both selections. All injections are simulations, not discovered defects.

SCN-FBK-03 body cases: malformed JSON; null/array/string roots; each missing field; an extra field; gameId string/null/boolean/array/object/zero/negative/fractional/unsafe; email and description null/number/array/object; unknown game with invalid email/description/missing email. All were rejected before insertion, with invalid body preceding game lookup. Unknown well-formed IDs 99999 and 9007199254740991 returned 404 NOT_FOUND. Query `?search=` plus malformed JSON returned 400 INVALID_QUERY first. Both simulated submission failures retained game 6 and exactly spaced email/description, then a real retry succeeded and was independently verified in SQL.

Native evidence: [per-variant results and SQL](evidence/new-features-structured-2026-10-27/results.json), [requests/responses and failures](evidence/new-features-structured-2026-10-27/network.json), [console](evidence/new-features-structured-2026-10-27/console.json), [native run output](evidence/new-features-structured-2026-10-27/native-run.log), [independent probe](evidence/new-features-structured-2026-10-27/probe.mjs), [trace](evidence/new-features-structured-2026-10-27/structured-trace.zip), [final synthetic database](evidence/new-features-structured-2026-10-27/structured-final.sqlite), [evidence verification](evidence/new-features-structured-2026-10-27/verification.json), [byte sizes and SHA-256 manifest](evidence/new-features-structured-2026-10-27/sha256.json). Ten recorded page exceptions are the harness storage initializer attempting sessionStorage on about:blank before each favourites context navigates. A [controlled isolated diagnostic](evidence/new-features-structured-2026-10-27/init-diagnostic.json) reproduced that exact error at about:blank and confirmed successful initialization at the HTTP origin. All ten favourites cases independently verified their actual HTTP-origin storage. These are harness errors, not product defects. Other console resource errors correspond to injected 500/abort cases.

Harness correction: the first owned build copy omitted the standard copy-assets shared validation JS asset, causing the UI module to fail to load. That attempt was interrupted; its incomplete raw results, screenshots, environment and output are retained under [harness-attempt-1](evidence/new-features-structured-2026-10-27/harness-attempt-1/native-run.log), excluded from the 120 passing checks. The missing build asset was copied exactly as the existing build script specifies, and every check ran anew against a fresh unique DB. This was a verification harness error; no product code was changed and no app defect is claimed.

## Focused correction of T3-DATA-01

Independent review identified that original `FEEDBACK-HTTP500` and `FEEDBACK-ABORT` reused the nonboundary description `Synthetic raw feedback must stay exactly entered.` for two accepted posts. This violated the unique-description convention in the requirements. The original safe-ID/+1/exact-row SQL evidence remains a valid functional observation; it does not establish that the data convention was met. Every original artifact, including original probe, results/native output, final SQLite and the original 32-entry SHA-256 manifest, remains byte-identical. Original manifest SHA-256: `3d81595d06dffcceb0dfd1f349fb329e8972262dcb3bfbc7be2f90f939ead964`.

A [focused charter](evidence/new-features-structured-2026-10-27/focused-recoveries/charter.md) was recorded before repeating only those two scenarios. New source [focused-recoveries.mjs](evidence/new-features-structured-2026-10-27/focused-recoveries/focused-recoveries.mjs) corrects the future data-generation rule: each nonboundary description contains its failure mode plus the focused run's exact timestamp. It does not alter the immutable original probe. The focused run used the unchanged original build, with every current app source and owned build byte hash verified against original environment records, on a fresh owned DB.

**Focused result: 2/2 PASS**, UTC **2026-10-27T06:31:52.067Z–2026-10-27T06:31:53.224Z**, v24.22.1, Playwright 1.63.0, Chromium 153.0.8010.12, 1280×800, `http://127.0.0.1:57525`, absolute DB `D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\sdd\portfolio-completion-2026-10-26\task-3-data\focused-recovery-2026-10-27T06-31-52.067Z.sqlite`. Each failed attempt retained game 6 and the exact raw spaced email/description with unchanged SQL rows. Each real retry returned 201 and a safe positive ID, added exactly one row, and matched the exact trimmed row selected by that ID in the same DB. Both accepted descriptions are distinct from each other and from every original accepted description. Zero focused page exceptions; the two console resource errors are the explicit 500/abort simulations. Owned app/browser were stopped.

| Corrected scenario | Unique raw description (surrounding spaces retained) | Result |
| --- | --- | --- |
| FEEDBACK-HTTP500-CORRECTED | `  Synthetic focused recovery HTTP500 run 2026-10-27T06:31:52.067Z  ` | PASS: preserved raw, no failed insert, real 201, ID/+1/exact SQL |
| FEEDBACK-ABORT-CORRECTED | `  Synthetic focused recovery ABORT run 2026-10-27T06:31:52.067Z  ` | PASS: preserved raw, no failed insert, real 201, ID/+1/exact SQL |

Evidence: [environment and source/build hashes](evidence/new-features-structured-2026-10-27/focused-recoveries/environment.json), [per-variant requests/responses/SQL](evidence/new-features-structured-2026-10-27/focused-recoveries/results.json), [native output](evidence/new-features-structured-2026-10-27/focused-recoveries/native-run.log), [network](evidence/new-features-structured-2026-10-27/focused-recoveries/network.json), [console](evidence/new-features-structured-2026-10-27/focused-recoveries/console.json), [trace](evidence/new-features-structured-2026-10-27/focused-recoveries/trace.zip), [fresh synthetic SQLite](evidence/new-features-structured-2026-10-27/focused-recoveries/focused-final.sqlite), [independent verification/accounting](evidence/new-features-structured-2026-10-27/focused-recoveries/verification.json), [separate focused byte/SHA-256 manifest](evidence/new-features-structured-2026-10-27/focused-recoveries/sha256.json). The original manifest covers its original 32 files only; the added subdirectory has its own manifest.

Accounting: original 120 functional checks included two data-convention deviations; 118 original conforming cases plus these two corrected cases support 120 scenarios. Historical completed executions total 122, with 21 accepted real posts across the two databases (19 original, two focused). The conforming evidence selection contains 19 accepted posts: 17 original plus two focused. No full suite or storage re-run occurred. This focused correction is ready for scoped independent re-review; it does not complete keyboard, native AT or overall Task 3 gates. The original trace is limited to feedback; separate original favourites contexts were not traced and remain supported by their state/network/console/screenshot evidence.

Not covered by this structured run: Firefox/WebKit/device/layout testing, complete keyboard-only review, native screen-reader output, server-dependency failure (the injected browser errors do not prove a real server failure), the complete existing suite or external CI. The separate session and acceptance inventory remain authoritative for those gates. Native AT remains pending; these results cannot establish full Task 3 completion or WCAG conformance.

