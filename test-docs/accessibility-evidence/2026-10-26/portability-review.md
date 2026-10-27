# Task 1 evidence byte-preservation follow-up review

Reviewed 2026-10-27. Scope: only the post-review Git line-ending preservation fix and its portability disclosures. The earlier Task 1 implementation review in `task-1-review.md` was not repeated. Owner `guard-approved-plan` constraints were applied; no contract deviation was proposed or introduced.

**Disposition: ADDRESSED. Specification verdict: PASS for this follow-up. Quality verdict: PASS. No actionable findings.** This verdict does not complete the remaining native AT, Linux CI, commit, clean-checkout or full-project acceptance gates.

## Independent verification

At `2026-10-27T06:16:57.063Z`, a read-only Node audit used `child_process.execFileSync('git', ['show', ':<path>'], { encoding: null })` and SHA-256 over the returned Buffers. Git blob bytes were never passed through a PowerShell text pipeline. The audit exited 0.

- All **42/42 actual index evidence blobs** match the existing values in `test-docs/accessibility-evidence/2026-10-26/sha256.json`; **zero mismatches**. All 42 worktree files also match. The staged inventory itself is byte-identical to its worktree copy; no inventory value was rewritten by this reviewer.
- `source-manifest.json` is itself included in those 42 matching entries, and its staged bytes equal its worktree bytes. All 13 current source/build worktree hashes match the recorded manifest values, consistent with the earlier independent review's 42/42 and 13/13 findings.
- Applying CRLF-to-LF conversion to the current text evidence would change exactly the 10 files named in `portability.md`: `affected/build.log`, `affected/run.log`, `green/run.log`, `package-metadata.json`, `red/run.log`, `sentinel-critical-red.log`, `sentinel-serious-red.log`, and the three files in `sentinel-source/`. This independently supports the stated normalization mechanism and affected list. The initial pre-fix index is historical evidence and was not recreated or claimed as directly re-observed.
- The staged root `.gitattributes` contains one functional rule: `test-docs/accessibility-evidence/2026-10-26/** -text`. `git check-attr --cached text` returns `unset` for all inventoried evidence, the inventory and portability note. It returns `unspecified` for all 11 tracked manifest source/config/test files, both generated `dist/` paths, `test-docs/accessibility-results.md`, an adjacent dated folder, and an adjacent similarly prefixed folder. The rule therefore changes evidence handling only and introduces no source-format policy. Current `core.autocrlf` remains `true`.
- Of the 11 tracked source/config/test blobs, 10 raw index hashes match the manifest. The only raw mismatch is `tests/accessibility/axe.spec.ts`: Windows worktree SHA-256 `f991deed9432ec2e0c8af3bd04dfb18325b70bc57cdd6694c8db73441f215a34`; Git blob SHA-256 `87527f01f72942e443cbdeab210e267925fb6d03e8d8e8d2ace4f60c20883225`. Its complete index bytes equal its worktree bytes after CRLF-to-LF conversion. Both generated `dist/` manifest entries have no index blob, as disclosed.
- The staged `.gitattributes`, `portability.md` and `accessibility-results.md` equal their reviewed worktree copies. Their explanations and the current `task-1-report.md` appendix correctly distinguish retrospective Windows worktree hashes from canonical Git hashes and contemporaneous scan provenance. They retain the original inventory, explain why raw source equality is not a cross-platform acceptance gate, and disclose that later notes/review are outside the original 42-file inventory.

Index entry snapshot SHA-256 (`git ls-files --stage -z`) at the audit: `b01264ebdfbcf9cfdae071d9a943022cffc8170032013b3ae293e92b4e5228c7`.

## Limits and reviewer actions

This audit establishes current staged evidence integrity and the scope of the staged attribute. It did not perform a checkout on another OS, reconstruct the original scan's missing contemporaneous source/DB provenance, or rerun browsers, build, tests, native assistive technology or CI. Those existing limits remain explicit; none was converted into a completed gate. The prior Task 1 review remains separate.

The reviewer made no source, evidence, configuration or index changes and created only this report. No subagents, staging, commit, publication or external result upload were used.
