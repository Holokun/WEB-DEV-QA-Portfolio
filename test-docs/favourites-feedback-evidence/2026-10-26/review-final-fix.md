**M1 — Active manual guide postpones implemented features** — ADDRESSED. `test-docs/manual-testing-start.md:64` now names `/#/favourites` and `/#/feedback`, links all five existing SCN-FAV/SCN-FBK procedures, and requires actual per-variant results while forbidding Passed for untested variants.

**New breakage in the fix diff:** None.

**Out-of-scope observations:** None.

**Checks:** Read the supplied fix package and implementer report. Compared the exact pre-fix snapshot against the current guide in memory: only line 64 differs. Verified all five target headings at `test-docs/test-scenarios.md:97`, `:104`, `:116`, `:123`, and `:132`; their Markdown anchors match the new links. Confirmed route dispatch and mounted feature imports in `app/ui/main.ts:3–5,31–35`. The instruction claims feature availability, not completed manual execution; surrounding result-recording requirements remain unchanged. No suite rerun or runtime/manual Pass claim. Initial route lookups used nonexistent guessed paths; corrected the lookup using the file inventory.

**Fix round:** All findings addressed, no new Critical/Important breakage. Scope limited to M1 and the one-line instruction diff; architecture, layout, root/main, launch, dependencies, mandatory reviews and release gates unchanged.
