# Task 2 fix round 1 scoped re-review

## Finding Verdicts

- **I1 — Library header navigation loses favourites during the same visit when persistence fails** — **ADDRESSED**. `app/ui/main.ts:17` intercepts ordinary unmodified primary clicks and clears the hash without replacing the document, retaining the existing store. `app/ui/index.html:12` retains `href="/"` and identifies the Library anchor. The handler leaves already-cancelled, modified and non-primary clicks alone; activation/pagehide attach and remove the same named listener (`app/ui/main.ts:54`, `app/ui/main.ts:61`). The added cases at `tests/e2e/favourites.spec.ts:154` exercise write/access denial, Library return, retained count/button/list, warning and main focus, then distinguish explicit reload from an internal route change.

## New Breakage in the Fix Diff

None. No new Critical/Important breakage found in the packaged fix diff.

## Out-of-Scope Observations

None.

## Evidence Checks

- Read the binding brief, I1, appended fix report and packaged fix diff. The package was read once; no git diffs were regenerated and no complete changed source files were reread.
- Checked retained RED output: both Library-return cases fail on the intended `Favourites (1)` assertion, receiving `Favourites (0)`.
- Checked `task-2-fix-1-final-green.log`: **18 passed (6.5s)**, including both Library-return regressions and prior favourites coverage. The new modifier probe observes cancellation by the app before suppressing native defaults; its scope supports handler passthrough, not actual new-tab behavior.
- Checked `task-2-fix-1-cleanup.log`: **1 passed (988ms)** for the existing Catalogue destroy probe. This establishes the existing view cleanup check, not independent coverage of the new header listener lifecycle; the paired attach/remove is supported by the diff inspection.
- Checked `task-2-fix-1-diff-check.log`: only LF/CRLF conversion notices, consistent with the recorded exit 0.
- Checked build-log availability with `Test-Path`: **False** for `task-2-fix-1-build.log`. The report records the direct build command exiting 0 with no output, but its linked raw log does not exist. Silent successful output through Tee can leave no file. Build success is therefore a recorded implementer claim without a retained raw log; the controller's fresh build before commit remains necessary evidence.
- Subsequently checked the controller's retained `task-2-controller-build.log` and `task-2-controller-typecheck.log`: both contain their expected pnpm script invocations without errors, and the controller reports both exited 0. These fresh logs resolve the missing build-output evidence; the controller confirms no product edits followed the 18-pass favourites and 1-pass cleanup runs.
- No tests were rerun: the diff raised no specific unresolved doubt requiring another execution. No source, index or branch changes were made; only this report was written.

## Verdict

**Fix round: All findings addressed, no new Critical/Important breakage.** I1 is closed. Fresh controller build/typecheck evidence is available. The fix is suitable to proceed to remaining controller integration checks and the task commit.
