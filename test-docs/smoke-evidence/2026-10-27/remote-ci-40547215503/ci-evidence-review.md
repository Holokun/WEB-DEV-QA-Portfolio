# Hosted CI evidence — independent focused review

Reviewed on 2026-10-27 against current HEAD `09fb1e0b02ab6af909837408b89a476597b25fd3`. Scope: new `test-docs/github-actions-results.md`, preserved run `40547215503` evidence, and the working-tree updates to README, summary, readiness audit, test plan, traceability, smoke history and saved-vacancy map. This is a focused evidence/documentation review, not another whole-code review.

**Final verdict: PASS. No unresolved actionable P0–P3 findings.** One minor current-status inconsistency was identified, corrected by the controller and rechecked below. Required hosted smoke/full execution is established for `09fb1e0`; actual screen-reader announcement coverage remains required and incomplete. The portfolio release gate remains OPEN.

## Independent verification

- Preserved official run response identifies `40547215503`, attempt 1, event `push`, branch `main`, exact head `09fb1e0b02ab6af909837408b89a476597b25fd3`, status completed/conclusion success. Created `17:05:12Z`, updated `17:09:40Z`; the full job completed at the latter time. Both job IDs and links in the report match the preserved jobs response.
- Both jobs succeeded through checkout, declared manager installation, frozen dependency installation, official browsers/Linux dependencies, the applicable test step and artifact upload. Each alternate matrix test step was intentionally skipped; this is distinct from a skipped required test case. Decoded logs show the exact checked-out SHA, Ubuntu 24.04.5, Node v24.22.1, pnpm 11.19.0 and Playwright 1.63.0. No rerun or source repair is recorded for this attempt.
- Independently parsed each downloaded native Playwright JSON, rather than trusting the derived summary. Smoke contains 15 expected/passed executions, five per desktop engine, 15 total attempts and all 15 tagged smoke paths. Full contains 583 expected/passed executions: API 156, Chromium 140, Firefox 140, WebKit 140 and Chromium phone seven, with exactly 583 attempts. Both have zero skipped/unexpected/flaky results, zero retry attempts, no native global errors, one worker and zero configured retries. Native durations are 20.336689 seconds and 211.573704 seconds, agreeing with rounded report values.
- All 54 manifest entries match their current bytes and SHA-256. Independently hashed the original full and smoke ZIPs: sizes 4,950,013 and 560,149 bytes and digests match official artifact metadata. Both artifacts identify the same run/head. Every extracted file was then compared directly with its ZIP entry without extracting or rewriting: 42 full and six smoke files, zero mismatches. Native HTML bundles and their data assets are among these exact copies.
- The existing dated `.gitattributes` rule applies `-text` to the new nested native JSON/HTML paths, preserving evidence bytes on commit. Reports retain Linux-native paths rather than claiming rewritten universal paths. Original ZIPs are scratch/provenance storage; the extracted reports/assets are the deliverable evidence and do not depend on future GitHub artifact availability.
- Checked 185 local targets in the eight affected presentation documents before the small status correction: all exist. Corrected paragraphs link only to the same already verified targets. No missing report or HTML-asset dependency was identified. The controller must include the currently untracked report/evidence and ignored HTML assets in the eventual evidence commit and perform its usual staged-byte check; this review did not stage anything.
- Confirmed empty source differences from clean checkpoint `1ec3aa5082851c47a471e20ec14a0b34f8b762d0` through current HEAD, and empty working-tree differences, for app, tests, scripts, workflow, package/lockfile and Playwright configuration. No architecture, permanent root, launch, dependency or acceptance change was introduced. Working-tree `git diff --check` passes, with normal CRLF advisories only.

## Finding addressed during review

**CI-DOC-01 — P3, current presentation retained pre-CI status.** Initial README line 78 still said external CI and final review remained open; the summary's smoke row and review/audit paragraphs, and readiness review row, retained similar present-tense language. With new top-level hosted success results, a reader could receive contradictory answers about whether CI had run and whether publication approval remained pending.

The controller corrected README, summary and readiness presentation to identify the old statements as their historical local/review stage, distinguish the later dedicated remote 15/15 and full 583/583 pass, and preserve the requirement to check each subsequent published head. The exact corrected paragraphs were re-read. **Resolved.** Historical native reports and the earlier screenshot failure were not rewritten. No source fix or test rerun was required.

## Limits and behaviors considered but set aside

- Actual loading/no-results/error/validation/confirmation screen-reader speech remains unverified. This is existing required acceptance work, not an optional exclusion; no Narrator action was performed here.
- This run proves its recorded SHA only. The planned subsequent documentation/evidence publication requires observing its own required jobs; run 40547215503 must not be described as a test of that future commit.
- The earlier local screenshot-capture failure remains historical with undetermined cause. A later independent complete smoke pass does not prove a root cause or product fix. No new investigation or repeated suite was warranted by this evidence review.
- Physical devices, native Safari, full WCAG/security/performance certification, gameplay QA and employment fitness remain outside this evidence claim. GitHub Actions evidence does not establish GitLab experience.
- The original whole-change review's pre-publication verdict is historical evidence and remains intact. Current documents now clearly distinguish that point in time from later authorized publication and hosted execution.

No test/build/install, source mutation, commit, push, external message, subagent or repeated broad review was performed. Only this review report was written. Review used the preserved official responses, logs and downloaded native artifacts; it did not issue a new remote workflow request.

**Ready for the reviewed CI evidence/documentation commit: yes. Whole portfolio release complete: no; remaining required actual AT and checks for any later published head must retain their truthful status.**
