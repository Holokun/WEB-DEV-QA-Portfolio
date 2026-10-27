# Portfolio Completion Implementation Plan

> **For agentic workers:** Use subagent-driven-development for implementation and independent task reviews, then whole-change review. The owner explicitly requires approval BEFORE architecture, final layout, Git location/ownership, launch method, new unapproved dependencies, mandatory workflow or acceptance changes. This boundary overrides autonomous-ruling clauses in skills.

**Goal:** Finish the existing Game Companion portfolio requirements with evidenced new-feature checks, accessibility, smoke/full CI, clean-checkout reproduction and a truthful final summary.

**Architecture:** Preserve the current vanilla TypeScript/Node HTTP/SQLite app, root/main checkout, package scripts, fixture and owned serial test lifecycle. Add only the already approved axe integration and GitHub Actions workflow. Agent-operated exploration and real screen-reader verification remain distinct from Vadim's historical human session.

**Tech Stack:** Existing pinned Node/TypeScript/Playwright/pnpm, SQLite; the already specified `@axe-core/playwright`; standard GitHub-hosted Linux Actions. No deployment, accounts, billing changes or third-party product integrations.

**Spec:** `PROJECT_PLAN.md`, `test-docs/requirements-and-risks.md`, `test-docs/test-plan.md`, `test-docs/test-scenarios.md`, `test-docs/traceability-matrix.md`; user request to independently conduct the remaining checks, report them and finish the portfolio.

## Global constraints

- Work at `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio`, in main with phased local commits. Preserve unrelated untracked skills, attachments, notes and TestRail export. No history rewrite or disposable permanent installation.
- One implementation worker at a time; fresh task reviewer, original-worker fixes and scoped re-review, then broad final review. Controller owns commits.
- No changed acceptance gate: all 21 inventory entries and required variants; five primary smoke paths in Chromium/Firefox/WebKit; full desktop UI/API/database/accessibility and Chromium 375x812 layout. All app/database execution remains serial, workers1, unique absolute owned DB and available port; isolated destructive/failure cases; no development/human DB reset.
- Required axe catalogue/detail/feedback scans have no critical/serious violations. Retain complete results including lower-impact findings; no silent rule exclusions or blanket WCAG certification. Keyboard and actual screen-reader announcements must be checked independently.
- Use synthetic feedback. Verify accepted POST201 by actual returned safe ID, exact trimmed SQL fields and +1 row; rejection sends/inserts nothing as applicable. Fixed Unicode/description boundaries have no uniqueness suffix.
- Historical dates/results/authorship stay unchanged. Agent-based exploration is never attributed to Vadim or described as human execution. Native AT output is distinguished from inferred accessible-tree assertions.
- Temporary verification apps/checkouts/reporters live under ignored test-results, have recorded provenance, and do not become runtime dependencies. Final production launch remains pnpm dev from the agreed root.
- Prepare concrete reviewable workflow/commits before any necessary publication approval. No GitHub push/shared-branch update, external messages, TestRail result publication or Larian application is performed by an implementer. Actual CI success requires observed external runs, not YAML alone.

## Review focus

1. An axe scan must reach loaded app content, not a loading/error/empty page by accident; pin it with observable headings/data and a controlled serious-violation sentinel in an isolated page.
2. Validation, loading/error/confirmation and favourite state must remain operable and intelligible with keyboard and real AT; an accessible DOM alone is not an announcement recording.
3. Smoke selection must be exactly five primary successful paths per desktop browser, with no accidentally selected validation variants or zero-test success.
4. CI installation/browser/project/report paths must work on Linux and preserve owned DB seriality; no continue-on-error, required skips or retry-until-green.
5. Fresh-checkout tests must use committed source and locked dependencies without symlinks/imports into the original workspace or reliance on ignored local files. Evidence must identify the tested revision and actual environment.

## Task 1: Accessibility automation and remediation

**Files:** `package.json`, `pnpm-lock.yaml`, `playwright.config.ts`; create `tests/accessibility/axe.spec.ts` and a focused helper if warranted; minimal relevant `app/ui/` fixes only for verified accessibility defects; `test-docs/accessibility-results.md`, dated evidence and genuine bug records when found.

- [ ] Install and pin the already approved axe adapter version after checking its actual package metadata/official compatibility. No other dependency.
- [ ] Add TEST-A11Y-01 catalogue (including meaningful loaded/filter/error/validation states) and TEST-A11Y-02 detail/feedback (normal/invalid/success), plus favourites coverage where useful. Attach full axe JSON. Require real content and no critical/serious violation; record other findings.
- [ ] Demonstrate the gate detects a controlled serious missing-label violation in an isolated browser DOM, labelled a sentinel rather than a discovered app defect. Record failure evidence before any verified app remediation.
- [ ] Include accessibility files in the three desktop projects, keeping API once and phone layout scope unchanged. Preserve all existing test matches.
- [ ] Verify focused axe and affected behavior tests, actual results and source identity. Do not broaden or repeat full suites without a new reason.
- [ ] Independent review/fix/re-review and scoped local commit.

## Task 2: Five-path smoke and GitHub Actions

**Files:** mark five existing primary cases in `tests/e2e/catalogue.spec.ts`, `detail.spec.ts`, `favourites.spec.ts`, `feedback.spec.ts`; `package.json`; create `.github/workflows/tests.yml`; focused evidence/report and README command updates.

- [ ] Add @smoke to exactly one primary path for TEST-UI-01/02/06/07/11, retaining SQL verification and all existing assertions. Add a documented test:smoke command covering three desktop browsers, 15 executions.
- [ ] Verify actual test listing, then smoke run. Avoid copying or weakening stable tests.
- [ ] Implement standard Linux smoke on every push and full on PR/default-main pushes, plus manual dispatch. Pin verified action versions; use declared pnpm and compatible Node, frozen install, official Playwright browser/dependency install, one worker, zero retries, read-only repository permissions and bounded timeouts/retention.
- [ ] Preserve native JSON/HTML and failure traces/screenshots on failure as well as success. Distinguish smoke/full artifact names. No external notifications or paid runners.
- [ ] Validate workflow syntax/selection locally, independent review/fixes, scoped commit. Publication is a later concrete approval step if not already explicitly authorized; a configured workflow is not an executed CI result.

## Task 3: New-feature exploration, keyboard and real screen reader

**Files:** `test-docs/manual/new-features-agent-session-2026-10-26.md`, dated evidence under the existing manual evidence structure, bug records and minimal tested fixes only when verified. Update scenario execution references without changing their criteria.

- [ ] Record charter, tester identity/tool/model, actual timing/build/browser/viewport/baseURL/DB and bounded session goals before actions. Cover SCN-FAV-01/02, SCN-FBK-01/02/03, relevant SCN-LAY-01/SCN-A11Y-01; keep per-variant results or explicit blocks.
- [ ] Drive the UI from fresh observed roles/names/states, record notes during exploration, inspect Network/Console/SQL, use isolated labelled network/storage failure conditions and preserve raw observations. Do not substitute rerunning the existing scripted suite for the requested agent-directed checks.
- [ ] Exercise labels, required/invalid associations, loading/no-results/error/confirmation and overlong search with an actually running available screen reader/browser pairing. Capture actual speech recap/transcription where available; never claim listening/announcements from DOM alone.
- [ ] Record browser/device limits honestly. No new account/software/system settings/security changes to bypass a block; request any genuinely required unapproved deviation while continuing independent work.
- [ ] Debrief, investigate/reproduce defects, add covering regressions for fixes and independently review the report/fixes. Recheck affected user paths against final source after remediation.

## Task 4: Clean reproduction, summary and external CI evidence

**Files:** `test-docs/test-summary-report.md`, final README/traceability/plan status, dated native evidence; current fit map linking the existing vacancy skills to concrete artifacts. Preserve historical audit as historical.

- [ ] Commit reviewed changes, then clone committed local Git source into an owned ignored verification directory. Install locked deps and official browsers as needed; no symlink to original node_modules/build. Verify documented dev launch and complete functional journey against an owned DB.
- [ ] Run full required matrix once on final committed source, retain native counts/errors/versions/hashes and portable reports; fix actual failures and rerun only justified scope.
- [ ] Inspect runnable workflow and exact publication delta. Obtain explicit publication approval if needed before pushing the reviewed commits; observe actual smoke/full CI jobs and artifacts. Diagnose/fix failed CI rather than claiming YAML success.
- [ ] Consolidate all 21 inventory entries/variants, human versus agent evidence, genuine defects versus simulations, WCAG checks versus certification, platforms/devices and limitations. All release claims link to authoritative evidence.
- [ ] Whole-change review, one final fix wave/scoped re-review, final user-journey and requirement-by-requirement goal audit. Keep goal active if any mandatory evidence is missing or blocked.
