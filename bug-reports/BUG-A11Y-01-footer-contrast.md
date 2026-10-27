# BUG-A11Y-01 — Footer text contrast below the normal-text threshold

Status: fixed in the uncommitted Task 1 draft. Severity: medium; axe impact: serious. Requirement: REQ-A11Y-01. Discovered by agent-run Chromium axe on 2026-10-26, not Vadim's historical session.

Reproduce on base `87d97821efc864f962fdab1a6070c89eb4c22f8c`: open the loaded catalogue, detail, or feedback page. The shared footer uses normal 12.8px text, foreground `#66766d`, background `#f4f6f4`. Actual axe contrast is 4.41:1; expected at least 4.5:1. The original catalogue scan identifies `footer` and its exact rendered HTML.

Fix: darken only the footer text to `#56665e`. The retained green catalogue scan reports 5.59:1 and a passing `color-contrast` node for the same footer. Across 57 app-state scans in Chromium, Firefox and WebKit, no critical/serious violation remains. Full default axe rules run without rule exclusions.

Evidence: [original full results](../test-docs/accessibility-evidence/2026-10-26/red/playwright.json), [green full results](../test-docs/accessibility-evidence/2026-10-26/green/playwright.json), [report and limits](../test-docs/accessibility-results.md). This confirms the measured footer combination, not the entire palette or WCAG conformance.
