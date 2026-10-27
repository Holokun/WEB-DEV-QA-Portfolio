# Game Companion — test summary

Status on 2026-10-27: **portfolio release gate remains open**. This report consolidates recorded evidence; it does not turn pending checks into passes. The [approved project plan](../PROJECT_PLAN.md) and [test plan](test-plan.md) retain their original acceptance criteria.

Game Companion is a local TypeScript browser application, Node HTTP API and SQLite database with a fictional ten-game fixture. The implemented scope includes catalogue search/filtering, details and patch notes, browser-local favourites, validated feedback and database startup/reset. The portfolio demonstrates requirements, risk-based scenarios, UI/API/SQL automation, investigated defects and reproducible evidence.

## Verified results so far

Latest [clean-checkout reproduction](clean-checkout-results.md): **583 passed, zero failures/skips/retries**, source `1ec3aa5082851c47a471e20ec14a0b34f8b762d0`, Windows/Node 24.22.1/pnpm 11.19.0, native duration 335.084s. API 156 once; each desktop 140 at 1280×800; Chromium-phone7 at 375×812. All21 inventory entries and 296 expanded definitions are represented. All15 tagged smoke paths passed inside that full invocation; this is a local result, not an external CI job. [Native JSON](clean-checkout-evidence/2026-10-27/full-results.json) and [HTML](clean-checkout-evidence/2026-10-27/html/index.html) are retained.

| Evidence | Actual scope and result | Revision / limits |
| --- | --- | --- |
| [Favourites and feedback regression](favourites-feedback-results.md) | 559 passed, no failures/skips/retries; API/database once, three desktop engines and Chromium phone layout. 288 expanded test definitions, covering 19 inventory entries. | Final recorded baseline `87d9782`; this precedes the accessibility UI fixes. Historical runs are distinguished in the source report. |
| [Accessibility and affected behavior](accessibility-results.md) | 24 passed accessibility executions: 57 real app-state analyses plus six gate-sentinel analyses; zero critical/serious app findings. Separate affected behavior/layout/keyboard run: 15 passed. | Committed as `94779eb`. Three occurrences of the same moderate detail-error heading finding remain open. Actual screen-reader review is not established by these results. |
| [Vadim's manual session](manual/testing-session-by-Vadim.md) and [coverage review](manual/testing-session-by-Vadim-review.md) | Human observations and their limits, preserved separately from later assistant work. | Historical first-slice evidence; no claim that Vadim performed the later automated or agent-operated checks. |
| [Agent-operated new-feature exploration](manual/new-features-agent-session-2026-10-26.md) | Observed favourites reload/filter/error behavior; empty/partial feedback; 19/20-emoji UI boundary with HTTP and matching SQL; failure simulations and recovery; invalid/empty search. | In progress, frozen baseline `87d9782`, supported in-app browser on 2026-10-27. This is not the complete named-variant sweep or native assistive-technology evidence. |
| [Independent structured new-feature checks](manual/new-features-structured-checks-2026-10-27.md) | 120 structured scenarios supported by118 original conforming cases plus two corrected focused recoveries (122 historical completed executions). All27 email and seven fixed-description inputs covered through UI/API; actual insertions checked by response ID, +1 row and exact SQL fields. | App source `94779eb`, Chromium desktop only. Scoped review addressed the duplicate nonboundary description convention in two focused corrections. The report separates initial harness errors, controlled failure simulations and native AT limits. |
| [Smoke and CI preparation](smoke-ci-results.md) | Listing selects exactly 15 executions. First complete smoke: 14 passed and one Chromium screenshot-capture failure; that unchanged case subsequently passed alone. | Scoped implementation/evidence review passed. All15 tagged cases later passed inside the fresh full matrix; screenshot root cause remains undetermined, no fix is claimed. A separate dedicated passing smoke invocation and external CI are not established. |

Inventory entries, expanded definitions, state analyses and browser executions are different measures. The fresh583 matrix is one complete invocation on committed source; historical runs are not added together to manufacture that result.

The [current saved-vacancy map](../main%20goal/portfolio-fit-map-2026-10-27.md) links concrete artifacts and unproven areas without changing the historical audit or claiming current vacancy availability.

## Defects and investigations

The [favourites/feedback report](favourites-feedback-results.md) records two assistant-discovered draft defects, their fixes and regression evidence: memory-only favourites were lost on ordinary Library navigation, and an unsafe feedback ID could be committed before the error response. They are not represented as defects discovered by Vadim or escaped production incidents.

Accessibility scans found and verified fixes for [footer contrast](../bug-reports/BUG-A11Y-01-footer-contrast.md) and [favourite visible/accessibility-name mismatch](../bug-reports/BUG-A11Y-02-favourite-visible-name.md). [BUG-A11Y-03](../bug-reports/BUG-A11Y-03-detail-error-heading.md), a moderate missing-h1 best-practice finding on the detail error view, remains open and recorded without a suppressed rule.

Controlled HTTP errors, socket aborts, storage failures and planted axe violations are test conditions. They are counted separately from genuine app defects. [SIM-CAT-01](../bug-reports/SIM-CAT-01-network-recovery.md) preserves the user-reported network-recovery check and its evidence limits.

## Remaining release evidence

- Complete independent whole-change review of the final source and evidence. The clean-checkout UI journey is recorded; subsequent [application-message and keyboard recovery observations](manual/application-messages-session-2026-10-27.md) cover catalogue/detail/notes Retry, combined controls, favourites and real feedback submission on the same source. Structured variant evidence has a scoped reviewed correction. These agent observations do not claim a human three-browser audit.
- Finish required actual screen-reader announcements. The [spoken-interface report](manual/spoken-interface-check-2026-10-27.md) records actual Narrator main/search output only; remaining loading/no-results/error/validation/confirmation states are not passed. Earlier launch rejection was historical; the later user-approved launch produced partial actual output.
- Observe required smoke/full GitHub Actions jobs and artifacts after authorized publication. The configured workflow and local all 15-tagged pass do not establish external CI.
- The clean-clone UI journey is completed: filtering/detail/notes/favourite reload/removal and real201 feedback with response-ID/+1-row SQL proof. The [controller UI observations](clean-checkout-evidence/2026-10-27/ui-journey/observations.md) retain the separate evidence and manifest. Actual AT announcements and final review gates remain open.
- Update the coverage references, portfolio fit map and final results; complete independent whole-change review and the requirement-by-requirement release audit.

The work is not a full WCAG certification, security audit, performance certification or physical-device test. Accounts, cloud favourites and third-party integrations are outside version one. Remaining actual AT, CI and final manual/review gaps remain acceptance work. Clean-install/dev/full-matrix evidence is available; any pending UI journey remains explicit. No Larian application, external message or automatic TestRail result publication is implied by this report.
