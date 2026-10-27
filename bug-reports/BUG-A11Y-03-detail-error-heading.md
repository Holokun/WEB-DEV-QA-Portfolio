# BUG-A11Y-03 — Detail request error view has no level-one heading

Status: open, lower-impact finding retained. Severity: low; axe impact: moderate (`page-has-heading-one`, best practice). Requirement: REQ-A11Y-01. Found in agent-run axe on 2026-10-26; retained after the two serious fixes.

Reproduce in an isolated test browser: intercept `/api/games/1` with HTTP 500 and navigate to `/#/games/1`. The real app renders Back, the alert `Could not load game details`, and Retry, but no h1. Expected: the detail error view provides a level-one page heading for heading navigation. The synthetic server failure is a deliberate condition; the missing heading is a real rendered-page finding, not the controlled missing-label sentinel.

The final full default-rule axe scan records one moderate node on this state in each of Chromium, Firefox and WebKit. Retry recovery reaches Orbit and passes the scan. This finding does not fail the agreed critical/serious gate; no rule is disabled and no claim of complete accessibility is made. No remediation is included in Task 1.

Evidence: [full green results](../test-docs/accessibility-evidence/2026-10-26/green/playwright.json), [state-level summary](../test-docs/accessibility-evidence/2026-10-26/green/scan-summary.json), attachment `axe-detail-error`.
