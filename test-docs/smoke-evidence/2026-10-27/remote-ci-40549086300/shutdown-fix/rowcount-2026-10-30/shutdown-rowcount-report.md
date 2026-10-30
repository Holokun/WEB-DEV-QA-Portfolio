# Shutdown feedback row-count completion

Date: 2026-10-30. Worker: Codex shutdown_rowcount_finish. Bounded follow-up to the reviewed shutdown R1; no production changes, commit, push, full-matrix run or repeated lifecycle/Chromium runs.

The active-feedback test now meets `test-docs/requirements-and-risks.md:90`: it captures the feedback count in its actual owned `dbPath` immediately before the first `active.write`, closes that pre-submission SQLite handle, then compares the count after the complete HTTP response and shutdown with `beforeCount + 1`. It selects exactly one row using the actual returned positive safe HTTP 201 ID and compares the existing exact trimmed synthetic fields. The unique UUID description, partial-body shutdown sequencing, exclusive SQLite transaction, cleanup, timeouts and four-case inventory remain unchanged.

Only `tests/api/lifecycle.spec.ts` was edited. Exact test change:

```diff
   try {
+    const beforeDb = new DatabaseSync(dbPath);
+    let beforeCount: number;
+    try {
+      beforeCount = Number(beforeDb.prepare('SELECT COUNT(*) AS count FROM feedback').get()!.count);
+    } finally { beforeDb.close(); }
     active.write(body.slice(0, 12));
@@
     const db = new DatabaseSync(dbPath);
     try {
-      expect(db.prepare('SELECT id,game_id,email,description FROM feedback').all()).toEqual([
+      const afterCount = Number(db.prepare('SELECT COUNT(*) AS count FROM feedback').get()!.count);
+      expect(afterCount).toBe(beforeCount + 1);
+      expect(db.prepare('SELECT id,game_id,email,description FROM feedback WHERE id=?').all(id)).toEqual([
         { id, game_id: 1, email: 'player@example.com', description },
```

## Verification

Executed once at the approved root `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio` using authorized Windows loopback/subprocess access outside the sandbox:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-results/sdd/portfolio-completion-2026-10-26/shutdown-r2.json'
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 exec playwright test tests/api/lifecycle.spec.ts --project=api --grep 'drains a received feedback body' --workers=1 --retries=0 --reporter=list,json --output=test-results/sdd/portfolio-completion-2026-10-26/scratchshutdown-r2-artifacts 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r2.log
exit $LASTEXITCODE
```

Exit 0. Native JSON records **1 passed, 0 unexpected, 0 skipped, 0 flaky**, one worker, retries 0; startTime `2026-10-30T08:05:00.117Z`, duration `976.0839999999998` ms. The selected test took 137 ms. This is the only runtime test run performed by this worker.

The first typecheck attempt ran the following command in the sandbox and exited 1 during npm bootstrap with `ENOTFOUND registry.npmjs.org`; TypeScript did not execute. Its raw failure log remains intact:

```powershell
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 typecheck 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r2-typecheck.log
exit $LASTEXITCODE
```

The same authorized pinned typecheck was then run outside the sandbox, retaining a separate success log:

```powershell
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 typecheck 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r2-typecheck-escalated.log
exit $LASTEXITCODE
```

Exit 0, `tsc --noEmit`. No dependency/configuration change or installation command was made. `git diff --check` exited 0 (existing LF-to-CRLF notices only). No build was needed because both reviewed application and existing built application hashes remain identical.

## Source freeze and evidence preservation

| File | Current SHA-256 |
| --- | --- |
| app/api/application.ts | b55bcff2e9500ed90530a596b8bf8058e84ab6bbb4177c70356d184773402541 |
| dist/app/api/application.js | c909cfb015ed3e22be524e1a12b30dd5d4833eafb55c3868621779744a81a92d |
| tests/api/lifecycle.spec.ts | 6d82a4b64ac1c74bb2ad91f9dba355789f7a171a9b5c52715be171d9f4a8e1b9 |

All 49 pre-existing shutdown-named scratch evidence files (including recursive artifacts and both prior manifests/reports) were hashed before this work and compared afterward: identical hashes and lengths. Historical source snapshots/manifests were not edited. Their old test identities remain historical; the new manifest `shutdown-rowcount-hashes.json` records this current test version and new proof separately.

Approved architecture, dependencies, launch, Git root/ownership, inventory and browser matrix remain unchanged. The owner's prospective readiness decision is retained in `docs/superpowers/plans/2026-10-27-owner-readiness-decision.md`; this task makes no screen-reader speech pass or full portfolio completion claim. Controller-owned documents and evidence publication files were not edited. Latest-source independent review, commit/push and required CI remain controller work.

Source frozen at the hashes above; worker stops after this handoff.
