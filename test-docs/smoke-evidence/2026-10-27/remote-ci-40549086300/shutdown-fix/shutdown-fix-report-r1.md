# Shutdown correction — independent-review fix R1

Date: 2026-10-27. Worker: Codex shutdown_failure_fix. This report supersedes the implementation/source-freeze section of `shutdown-fix-report.md`; the original report, manifest and raw RED/GREEN evidence remain unchanged as historical records. Controller owns review, commits and publication.

## Verified review finding

The independent reviewer identified that the first correction removed a socket from tracking permanently after its first request. I verified this before changing production code, using the new `application shutdown releases a reused connection with incomplete next-request headers` regression.

The test starts a real application and owned SQLite database, completes a GET `/api/games/1` through Node's HTTP client with a real keep-alive Agent, and asserts 200. It retains that same client socket and the server's accepted socket, writes only `GET /api/games HTTP/1.1\r\nHost:` on the same connection, awaits server-side receipt, then calls app.close. Before the R1 production edit, close remains pending and the unchanged 2-second regression assertion fails (`Expected true / Received false`). This is deterministic RED, not a static inference or flaky repeated run.

The first request has completed; no second complete HTTP request exists for the application to handle. Node's parser sees the partial next headers as active and excludes this connection from closeIdleConnections. The old never-requested-only set no longer contains it. Therefore the original correction left a real shutdown completeness gap on reused connections.

## Minimal correction

`app/api/application.ts` now keeps every accepted socket in an active-request count map for its whole connection lifetime. A parsed request increments its count. It decrements exactly once only after the body is complete and its response has finished. Socket close removes the map entry.

At shutdown the listener stops, then only sockets with zero parsed active requests are destroyed, including preconnects, first partial headers and reused partial headers. Requests already being handled remain live. When an active request completes during shutdown and its socket count reaches zero, the socket is ended after its response finish; Node's idle-only cleanup also runs. This prevents a partial following header or keep-alive timer from retaining a drained connection while preserving complete valid feedback writes and responses. The database still closes only after server.close resolves. No closeAllConnections, force-kill, timeout increase, retry, skip, assertion weakening or fixture change.

The existing active-feedback regression still completes a partially received POST after shutdown begins, receives complete HTTP 201 and a positive safe ID, verifies exactly one row with the exact trimmed unique synthetic fields, and opens an exclusive SQLite transaction afterward. It passed on R1. There are no mocks or alternate server implementations.

## Scope and current source identity

Approved root/main checkout and Node HTTP/SQLite/vanilla TypeScript architecture are unchanged. Base HEAD remains `e61f22db2a60090690824a388ad3a109e7033df4`; the following hashes identify working files before controller commit:

| File | SHA-256 |
| --- | --- |
| app/api/application.ts | b55bcff2e9500ed90530a596b8bf8058e84ab6bbb4177c70356d184773402541 |
| tests/api/lifecycle.spec.ts | 850f3a10591b9f563107496da569bf9239da06542bd75148e026020d9bb03103 |
| dist/app/api/application.js | c909cfb015ed3e22be524e1a12b30dd5d4833eafb55c3868621779744a81a92d |

Node v24.22.1, pinned pnpm 11.19.0, locked Playwright 1.63.0, Windows. Actual loopback/SQLite/browser execution used the authorized outside-sandbox path because sandbox loopback is denied. All runs are serial workers1/retries0 against fixture-owned absolute databases.

Read the prospective owner decision in `docs/superpowers/plans/2026-10-27-owner-readiness-decision.md`; it does not waive shutdown correctness, independent review or latest-source CI. This worker did not change controller-owned acceptance documents or historical evidence.

## Exact verification commands and results

Commands below execute at the approved root in PowerShell. The RED command ran before the R1 production change:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-red.json'
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 exec playwright test tests/api/lifecycle.spec.ts --project=api --grep 'reused connection' --workers=1 --retries=0 --reporter=list,json --output=test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-red-artifacts 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-red.log
exit $LASTEXITCODE
```

Exit 1, **1 expected regression failure**: close predicate false. JSON stats startTime 2026-10-27T17:36:16.705Z, duration 2649.627 ms, unexpected 1. Native trace retained.

After the R1 correction:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-lifecycle-green.json'
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 exec playwright test tests/api/lifecycle.spec.ts --project=api --workers=1 --retries=0 --reporter=list,json --output=test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-lifecycle-green-artifacts 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-lifecycle-green.log
exit $LASTEXITCODE
```

Exit 0, **4 passed, 0 skipped, 0 flaky, 0 unexpected**, startTime 2026-10-27T17:36:44.242Z, duration 1158.239 ms. Includes the reused-header case, preconnect, initial partial headers, and active feedback/body/response/SQL guarantee.

```powershell
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 build 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-build.log
exit $LASTEXITCODE
```

```powershell
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 typecheck 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-typecheck.log
exit $LASTEXITCODE
```

Both exit 0. Then the two original hosted Chromium failures were rechecked because shutdown source changed:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-chromium-green.json'
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 exec playwright test tests/e2e/favourites.spec.ts tests/e2e/feedback.spec.ts --project=chromium --grep 'invalid/duplicate IDs normalize|repeated submit events while pending' --workers=1 --retries=0 --reporter=list,json --output=test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-chromium-green-artifacts 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-r1-chromium-green.log
exit $LASTEXITCODE
```

Exit 0, **2 passed, 0 skipped, 0 flaky, 0 unexpected**, startTime 2026-10-27T17:37:23.854Z, duration 1686.317 ms. `git diff --check` also exited 0 (only normal LF-to-CRLF notices).

## Evidence and readiness handoff

New provenance: `shutdown-evidence-hashes-r1.json`, containing current source identities and retained evidence hashes. The first manifest records the first reviewed candidate's source identities; those historical source hashes are superseded, not current-source assertions. Earlier evidence file bytes, original report and manifest are preserved unchanged, including the initial raw chunked-response oracle failure and all separately labelled RED/GREEN attempts.

The exact hosted TCP connection identity remains unobserved. This R1 proves the reviewed additional lifecycle gap and its correction locally; it does not retroactively add server telemetry to the hosted run. Four additional API regressions imply a future full expected count of **587**, subject to actual listing/CI. No full matrix was run locally in R1. The earlier focused 7/7 run belongs to the first candidate, while current verification is lifecycle4/4 plus Chromium2/2 and build/typecheck. Actual latest-source Linux CI and fresh independent re-review remain controller work.

Source is frozen at the R1 hashes above; no commit or push was performed by this worker.
