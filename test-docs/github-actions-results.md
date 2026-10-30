# GitHub Actions execution — 2026-10-27

**Required remote automation passed:** [Tests run 40547215503, attempt 1](https://github.com/Holokun/WEB-DEV-QA-Portfolio/actions/runs/40547215503), triggered by the owner-approved push to public `main` at `09fb1e0b02ab6af909837408b89a476597b25fd3`. Run created17:05:12 UTC and completed17:09:40 UTC. This is actual hosted execution, separate from the earlier Windows evidence and local workflow validation.

| Job | Native result | Projects | Test duration |
| --- | --- | --- | --- |
| [Smoke](https://github.com/Holokun/WEB-DEV-QA-Portfolio/actions/runs/40547215503/job/122340927871) | 15 passed; zero failures/skips/flaky/retry attempts | Chromium5, Firefox5, WebKit5 | 20.337s |
| [Full](https://github.com/Holokun/WEB-DEV-QA-Portfolio/actions/runs/40547215503/job/122340927389) | 583 passed; zero failures/skips/flaky/retry attempts | API156; Chromium140; Firefox140; WebKit140; Chromium phone7 | 211.574s |

Both jobs used Ubuntu24.04, Node24.22.1, declared pnpm11.19.0 and Playwright1.63.0. Checkout, frozen-lockfile installation, official browser/Linux dependency installation, test execution and artifact upload succeeded. Workers=1 and retries=0 are also recorded in each native JSON. The alternate test step is intentionally skipped in each matrix job; no required test case was skipped. No workflow rerun or source fix was needed.

## Evidence

The [terminal run response](smoke-evidence/2026-10-27/remote-ci-40547215503/run.json), [jobs](smoke-evidence/2026-10-27/remote-ci-40547215503/jobs.json), [artifact metadata](smoke-evidence/2026-10-27/remote-ci-40547215503/artifacts.json), [derived counts](smoke-evidence/2026-10-27/remote-ci-40547215503/derived-summary.json) and decoded connector job logs are preserved. Downloaded artifact contents are unchanged:

- Smoke: [native JSON](smoke-evidence/2026-10-27/remote-ci-40547215503/smoke/playwright.json), [HTML](smoke-evidence/2026-10-27/remote-ci-40547215503/smoke/html/index.html), [decoded job log](smoke-evidence/2026-10-27/remote-ci-40547215503/smoke-job-log.json).
- Full: [native JSON](smoke-evidence/2026-10-27/remote-ci-40547215503/full/playwright.json), [HTML](smoke-evidence/2026-10-27/remote-ci-40547215503/full/html/index.html), [decoded job log](smoke-evidence/2026-10-27/remote-ci-40547215503/full-job-log.json).

Archive SHA256 values independently matched GitHub's artifact digests before extraction:

| Artifact | ID | ZIP bytes | SHA256 |
| --- | --- | --- | --- |
| playwright-smoke-40547215503-1 | 12753926134 | 560149 | a7db3eddfeb58b22dd4820ff85ea81d6f4f8ca3edb504ae327c0a1ef5f667180 |
| playwright-full-40547215503-1 | 12754645409 | 4950013 | cdcb2de11d16c4de73f46b19af552a35af8106e2d7b1ecc8d1d17548e6a67cd9 |

The [54-file manifest](smoke-evidence/2026-10-27/remote-ci-40547215503/sha256.json) records preserved bytes. Original ZIPs remain in ignored verification storage; their extracted native reports and assets are committed, so GitHub's14-day artifact expiry does not remove portfolio evidence. Temporary signed download URLs and credentials are not retained. Failure-only traces were not manufactured for passing cases; successful report assets are retained.

The [independent evidence review](smoke-evidence/2026-10-27/remote-ci-40547215503/ci-evidence-review.md) passed after a minor stale-status correction. A [fresh scoped reviewer](smoke-evidence/2026-10-27/remote-ci-40547215503/ci-status-fix-review.md) verified those corrections. These later review records sit outside the original54-file manifest.

The earlier dedicated local smoke14/1 screenshot-capture failure remains historical evidence in [its report](smoke-ci-results.md). This later independent complete smoke pass does not establish the cause of that earlier failure or invent a product fix.

## Readiness limit

The subsequent [run40549086300](https://github.com/Holokun/WEB-DEV-QA-Portfolio/actions/runs/40549086300) at documentation-only revision `e61f22db2a60090690824a388ad3a109e7033df4` had smoke15 passed but full581 passed/two failed, zero skipped/flaky tests. Both Chromium failures reported `Owned app failed to stop` from the ten-second process teardown in `tests/fixtures/app.ts`; their preceding UI/SQL assertions completed before this teardown error. The tests remain failed. This contradicts any claim that the first green run establishes the latest head's readiness. The [repair report](shutdown-repair-results.md) records deterministic reproductions, the corrected server and versioned local verification; no timeout increase or unchanged rerun is treated as a fix. Required CI for the corrected published source is separate.

Preserved [native failed JSON](smoke-evidence/2026-10-27/remote-ci-40549086300/full/playwright.json), [HTML with traces/screenshots](smoke-evidence/2026-10-27/remote-ci-40549086300/full/html/index.html), [decoded log](smoke-evidence/2026-10-27/remote-ci-40549086300/full-job-log.json), official run/jobs/artifact metadata and a [78-file manifest](smoke-evidence/2026-10-27/remote-ci-40549086300/sha256.json) retain the failure. Full ZIP artifact12754461857 had7967321 bytes and SHA256 `1a7d2fd63d9bd490e2692e0ff4925fd4ca8391693385f2913bae6a93504336ed`, independently matching GitHub's digest before extraction. No original passing-run evidence was replaced.

This run verifies the recorded source. Subsequent documentation commits have their own workflow runs; do not describe this run as testing a later SHA. Current required CI must be checked against the latest published head before a final release claim. The full local source/evidence review remains recorded separately. The [portfolio release gate](portfolio-readiness.md) now applies the separately recorded [owner-approved acceptance scope](../docs/superpowers/plans/2026-10-27-owner-readiness-decision.md). It still requires the shutdown correction, review and successful required CI for the published head. No Larian application was authorized or sent.
