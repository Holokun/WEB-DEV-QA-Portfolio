# T3-DATA-01 focused recovery re-review — 2026-10-27

**Verdict: addressed. No new actionable findings in this limited correction.** The two corrected recovery variants satisfy the unique-description rule and retain the original failure-preservation and real-insertion oracles. This closes only T3-DATA-01; it does not complete Task 3 or accept a substitute for actual native assistive-technology testing.

Independent Codex review of the original finding, focused handoff appendix, updated durable report, focused charter/source/finalizer, retained JSON/native logs, SQLite, screenshots and trace archive. Applied the owner's `guard-approved-plan` contract. Only this review file was written. No application/browser execution, scenario or suite rerun, source/evidence/index mutation, architecture/launch/dependency/Git change, native action or acceptance-gate change occurred.

## Findings and evidence

The rule in `test-docs/requirements-and-risks.md:88` and `test-docs/test-scenarios.md:139` requires unique accepted nonboundary content. `focused-recoveries.mjs` generates each description from its failure mode plus the exact run timestamp, retains surrounding spaces, and asserts uniqueness against both the other focused case and original accepted descriptions. Its assertions observe rendered fields, real responses and SQLite rather than trusting recorded PASS labels alone. The original probe and evidence remain immutable historical observations.

| Check | Independent result |
| --- | --- |
| Corrected data | HTTP500 and ABORT descriptions are distinct, contain `2026-10-27T06:31:52.067Z`, and differ from every original accepted description. Neither is a fixed boundary input. |
| Failure preservation | Both records retain game `6`, exact raw spaced email and description, and equal full SQL rows before/after the simulated failure. Screenshots show the visible request error and retained form contents; JSON and source assertions establish exact whitespace. |
| Real recovery | Each route interception is removed before retry. Network records show the simulated 500 or abort followed by a real POST 201 with returned IDs `1` and `2`. Both IDs are positive safe integers. Row counts change `0→1` and `1→2`, with every prior row preserved. |
| Exact storage | Opened `focused-final.sqlite` read-only and independently selected each returned ID. Each query returns exactly the expected game, case-preserved trimmed email and its unique trimmed description. Final two-row database equals the last recorded after-snapshot. |
| Fresh environment | Source `94779ebd20c08e763ec0c99cae4aa0dbb4238af7`, recorded fresh owned absolute DB, separate port and run interval are explicit. All 19 current source hashes and 20 owned build hashes match the focused environment and original source/build records. Probe asserts the new DB is absent before launch and empty after startup. |
| Native/runtime evidence | Native output reports precisely the two corrected PASS cases. Network has two POST attempts per case and the expected failed/recovered outcomes. Console contains only the two labelled injected-resource errors and zero page exceptions. Trace ZIP opens and contains trace/network/screenshots. |
| Original integrity | Independently recomputed binary byte sizes and SHA-256 for all 32 original manifest entries; all match. Original manifest hash remains `3d81595d06dffcceb0dfd1f349fb329e8972262dcb3bfbc7be2f90f939ead964`. |
| Focused integrity | All 17 focused manifest entries match byte size and SHA-256. Its manifest hash is `2feec8706117e5b29c8944f896c0f519676d2d3a644c33c506afe3a92e22f793`. The two manifests cover 49 entries together and each excludes itself. |

The handoff and durable report accurately distinguish **118 original conforming cases plus two corrected focused cases supporting 120 scenarios**, from **122 historical completed executions**. They do not claim a new full 120-case run. The 21 historical real inserts comprise 19 original plus two focused; the selected conforming insertion evidence comprises 17 original plus two focused. Original duplicated-description cases remain labelled valid functional observations with a convention deviation. Updated durable report SHA-256 independently matches `26e61e1f717a052d4438dc4426c3dd5f97e8db24fbc9441e98fb4a974eb24f55`.

## Scope limits

No broader product-regression or repeatability claim follows from this evidence-only re-review. Browser-route failure simulations do not establish a real server-dependency failure. Complete keyboard/final-source interactive paths, actual native screen-reader output and the other approved completion gates remain open or separately governed by the acceptance inventory. DOM associations, structured automation and these two corrected recoveries do not satisfy the actual native AT gate. The original review's other scope limits and historical verdict remain intact.
