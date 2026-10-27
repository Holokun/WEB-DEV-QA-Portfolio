# Accessibility automation results

Evidence portability follow-up: [byte-preservation audit and source-hash limitations](accessibility-evidence/2026-10-26/portability.md). A scoped `.gitattributes` rule preserves the native dated evidence bytes; original hashes remain unchanged. Raw source-manifest hashes describe Windows worktree bytes and are not cross-platform source-equality gates.

Agent execution: 2026-10-26; evidence audit and focused follow-up: 2026-10-27 (Asia/Yerevan). Scope: Task 1 of the approved [completion plan](../docs/superpowers/plans/2026-10-26-portfolio-completion.md), REQ-A11Y-01, TEST-A11Y-01/02 and affected TEST-UI-07/08/12/13 behavior. These are agent-operated checks, separate from Vadim's historical manual session and from the controller's native assistive-technology work.

## Result

The retained accessibility run passed **24/24 test executions**: six app tests plus two gate sentinels in each of Chromium, Firefox and WebKit. Its **57 app-state axe analyses** (19 per engine) contain **zero critical/serious findings**, **three moderate finding occurrences**, **zero minor findings**, and **zero incomplete rule results**. The three moderate occurrences are the same missing h1 on the deliberately triggered detail error view, once per engine; [BUG-A11Y-03](../bug-reports/BUG-A11Y-03-detail-error-heading.md) remains open. Six additional analyses belong only to the controlled critical/serious sentinels.

Two genuine app defects were fixed: [footer contrast](../bug-reports/BUG-A11Y-01-footer-contrast.md) and [favourite visible/accessibility-name mismatch](../bug-reports/BUG-A11Y-02-favourite-visible-name.md). The original Chromium run failed six app tests and passed one sentinel assertion. The footer was 4.41:1 against the required 4.5:1 for its normal text. Catalogue buttons displayed `Add to favourites` while aria-label inserted the title between those words; axe reported `label-content-name-mismatch` on ten catalogue nodes, plus detail/saved nodes. The green rendered results explicitly show footer contrast **5.59:1**, and text/aria-label both `Add Orbit to favourites`. Saved names remain `Remove Orbit from favourites`. This ties green evidence to both actual remediations.

Focused follow-up passed **15/15 executions**, zero skips/failures/retries: the primary favourite add/detail/remove/save/reload path in all three desktop engines; saved-list removal by Enter/Space with focus transfer, long-title wrapping, and detail/notes keyboard navigation in all desktop engines plus Chromium 375x812. Two exact visible-label assertions were added to the existing primary favourite regression. Build/type compilation passed. The successful accessibility scans were reused, not repeated.

## What was exercised

| Area | Observable states before scanning |
| --- | --- |
| Catalogue (TEST-A11Y-01) | heading plus 10 real cards; Ember + RPG yielding Ember Quest; 81-character invalid search with no new request; no results and no cards; held real response/loading; HTTP 500 retaining 10 cards; Retry yielding Orbit/ORBIT |
| Detail (TEST-A11Y-02) | Orbit heading and real description; patch-note network error; Retry yielding three notes and status; HTTP 500 detail error; Retry yielding Orbit |
| Feedback (TEST-A11Y-02) | loaded game options; empty submit with three invalid fields and descriptions, no POST/SQL insertion; aborted request with unchanged SQL; held real POST/pending aria-busy; actual HTTP 201, safe returned id, exactly one additional SQL row with trimmed game/email/description, confirmation |
| Favourites supplement | saved Orbit list; removal to empty state |

`tests/accessibility/check.ts` runs all default axe rules, attaches complete results before asserting, and fails on critical/serious violations. There are no tag filters, disabled rules or excluded elements. Lower impacts, passes and incomplete results remain in the attached JSON. The default rule set is broader than just WCAG A/AA tags; rule severity is not itself a conformance determination.

Controlled missing-label inputs are **test instrumentation, not app bugs**. The initial native input sentinel was historically titled “serious”; its actual axe impact was **critical** (`label`). Separate preserved failing runs demonstrate both critical and serious rejection, with the latter using an unnamed contenteditable textbox (`aria-input-field-name`). Current permanent tests correctly name both impacts and expect the helper to reject; therefore those tests pass when the gate detects the planted defect. Raw red exit-one evidence remains unchanged.

## Environment, evidence and reproduction

Working root: `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio`, branch main, base `87d97821efc864f962fdab1a6070c89eb4c22f8c` plus the uncommitted Task 1 delta. Node v24.22.1; observed follow-up pnpm 11.25.0 (package declaration remains pnpm@11.19.0); Playwright 1.63.0; pinned `@axe-core/playwright`/axe-core 4.14.0. [Recorded registry package metadata](accessibility-evidence/2026-10-26/package-metadata.json) specifies Node >=22.12.0 and playwright-core >=1.0.0, compatible with this environment. No other dependency was added.

Windows-hosted headless engine user agents in the original results: Chrome 153.0.8010.12, Firefox 155.0, WebKit reporting Safari 26.6. Desktop viewport 1280x800; phone follow-up is Chromium emulation at 375x812, not a physical device. Axe started 2026-10-26T15:31:18.853Z and took 45.6s. Follow-up timestamps and duration (21.7s) are in its native JSON. All app execution used the existing serial workers=1 fixture, port 0 and a fresh absolute marked database under ignored `test-results/owned-databases`; no development/human DB was reset. The original run did not retain its exact DB path as a separate ledger; catalogue axe URLs retain its actual local port (55718).

Reproduction commands from the agreed root, after locked dependency/browser installation:

```powershell
pnpm build
pnpm exec playwright test tests/accessibility/axe.spec.ts --project=chromium --project=firefox --project=webkit --reporter=list,json
pnpm exec playwright test tests/e2e/favourites.spec.ts tests/e2e/layout.spec.ts --grep 'cards, detail and saved list|saved list, count|isolated long title|keyboard opens game' --project=chromium --project=firefox --project=webkit --project=chromium-phone --reporter=list,json
```

Durable evidence:

- [Original red full native report](accessibility-evidence/2026-10-26/red/playwright.json), [log](accessibility-evidence/2026-10-26/red/run.log) and retained failure screenshots/traces under `red/artifacts/`.
- [Critical sentinel red](accessibility-evidence/2026-10-26/sentinel-critical-red.json), [serious sentinel red](accessibility-evidence/2026-10-26/sentinel-serious-red.json), corresponding logs and [sentinel source](accessibility-evidence/2026-10-26/sentinel-source/sentinel.spec.ts).
- [Green full native report](accessibility-evidence/2026-10-26/green/playwright.json) with **all complete axe results embedded as base64 JSON attachment bodies**, [log](accessibility-evidence/2026-10-26/green/run.log), [derived state summary](accessibility-evidence/2026-10-26/green/scan-summary.json).
- [Focused behavior native report](accessibility-evidence/2026-10-26/affected/playwright.json), [log](accessibility-evidence/2026-10-26/affected/run.log), [build log](accessibility-evidence/2026-10-26/affected/build.log), saved-view screenshots under `affected/artifacts/`.
- [SHA-256 evidence inventory](accessibility-evidence/2026-10-26/sha256.json) and [source/build manifest](accessibility-evidence/2026-10-26/source-manifest.json). Source hashes are **retrospective**, recorded during resumption; no hash was captured at the original axe invocation. The manifest does not manufacture that missing provenance. Green attachment HTML/contrast independently corroborate the current fixes; focused behavior ran freshly built current source.

## Limits and remaining gates

This is not a WCAG 2.2 AA certificate or a claim that all accessibility checks pass. Native screen-reader announcements were not captured by Task 1; DOM status/aria assertions are not speech evidence. Full keyboard scenario review, actual AT output, Linux CI execution, independent review, scoped commit, and final clean-checkout/full-matrix verification belong to the remaining approved workflow. No external CI run, publication, commit or TestRail result upload was performed here. Browser emulation does not establish physical mobile support; manual visual palette/focus-obscuring/resize audits were not completed by these scans.
