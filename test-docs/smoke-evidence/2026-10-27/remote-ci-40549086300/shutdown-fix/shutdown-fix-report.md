# Shutdown failure investigation and local fix

Date: 2026-10-27. Implementer: Codex shutdown_failure_fix subagent. Controller owns commits, reviews and publication. No commit or push was performed by this worker.

## Scope and source identity

Approved root: `D:/Projects/WEB_DEV/WEB-DEV-QA-Portfolio`, branch main, HEAD `e61f22db2a60090690824a388ad3a109e7033df4`. Read AGENTS.md and the approved `docs/superpowers/plans/2026-10-26-portfolio-completion.md`. Applied systematic-debugging, test-driven-development and guard-approved-plan; controller retains SDD review/commit ownership. No architecture, folder, dependency, launcher, fixture timeout, retry, skip or required gate change.

Final source SHA-256 (working files, not a new committed revision):

| File | SHA-256 |
| --- | --- |
| app/api/application.ts | dff9e83f212ddf0a68fa3d5363e50e104621be95dc11c7998a0ba1ed0ddbce4f |
| tests/api/lifecycle.spec.ts | 53c9ce743da168c9faf8caf4545ce8f8eb3683200dfaea99f504a633ac731028 |
| dist/app/api/application.js | 333c1075fc65d0af5a2b7cb9a04d40cb71f1482137f2936f0b9ebc1927c0aff0 |

HEAD application blob SHA-256 before changes: `4bad52640de602170f0c9f6e7159a02e63dd9a3bc3ce381c54b23f07626f4ede`.

Environment: Windows, Node v24.22.1, pinned pnpm 11.19.0, locked Playwright 1.63.0. Tests use actual loopback HTTP/TCP and absolute fixture-owned SQLite paths with owner markers. Browser verification uses the installed Chromium project. No development/human database was touched.

## Hosted failure evidence, read without modification

Run 40549086300 attempt 1 at HEAD: smoke 15 passed; full 581 passed and 2 failed. Both failures are `Owned app failed to stop` at tests/fixtures/app.ts:43, the existing 10,000 ms timer. The controller preserves the raw hosted evidence and its manifest under `test-docs/smoke-evidence/2026-10-27/remote-ci-40549086300/`.

Inspected both ZIP `test.trace` streams directly using System.IO.Compression.ZipFile.OpenRead, without modifying the raw ZIPs:

- `full/artifacts/e2e-favourites-TEST-UI-08--a15a1-ates-until-complete-success-chromium/trace.zip`: every recorded assertion succeeded, including final expect@59 (stored IDs [10], favourites.spec.ts:91), ending at monotonic 36671.459 ms. The sole error is shutdown; After Hooks begins at 46672.295 ms. Browser context is closed only afterward.
- `full/artifacts/e2e-feedback-TEST-UI-11-re-8656c--request-and-insert-one-row-chromium/trace.zip`: every recorded assertion succeeded, including POST 201, confirmation, one request, +1 row and exact matching SQL row; final expect@50 (feedback.spec.ts:167) ends at 60657.828 ms. The sole error is shutdown; After Hooks starts at 70663.461 ms. Browser context closes afterward.

These prove shutdown failed after the assertions. The hosted traces do not contain server TCP socket telemetry. The exact socket responsible in that run remains unobserved; the local reproduction below proves a real application defect consistent with, but not uniquely identifying, the hosted cause.

## Reproduction and mechanism

Before production edits, an unchanged built createApplication was started against a fresh owned scratch SQLite path. A real TCP client connected and the server's connection event was awaited; no HTTP request was sent. Calling app.close stopped listening, but after 250 ms the probe reported `{"closedBeforeClientDestroy":false,"serverListening":false,"connections":1}`. Destroying the client immediately allowed close to complete. No flaky repetition was used.

The fixture sends termination and awaits process exit; the server's signal handler awaits app.close; app.close awaited server.close before database.close. Thus a socket that prevents server.close completing also prevents process exit. The fixture timeout correctly reports the leak rather than being its root cause.

The first deterministic RED run reproduced this with an accepted unused socket, server-observed incomplete HTTP headers, and a partially received feedback body alongside an unused socket. All three fail specifically because app.close remains unresolved, with a 2-second regression assertion (shorter than the fixture's unchanged 10-second stop timeout).

The initial fix released only sockets that never emitted a request. This passed the first two tests. The initial active-feedback test had a raw HTTP oracle bug: JSON parsing did not decode transfer-encoding chunk framing. Its first GREEN attempt therefore had 2 passed / 1 failed with SyntaxError; that failure is not product RED evidence. The oracle was corrected to use Node's real HTTP client. The corrected native keep-alive client then showed a second lifecycle fact: a connection active when server.close scans idle connections can become idle after its response finishes and keep close pending until the normal keep-alive timer. Its 201 response completed, but the 2-second close assertion failed. This is preserved separately in shutdown-green-2.*.

Inspected the bundled Node v24.22.1 `_http_server` source via process.binding('natives') during diagnosis: close performs a single closeIdleConnections scan; resOnFinish can later arm the keep-alive timer. The fix now also asks Node to close idle connections after each response finish while shutdown is underway. Active request connections are excluded by Node's API, and the SQLite connection still closes only after server.close completes.

Primary reference: [Node v24.22.1 HTTP close/closeIdleConnections/closeAllConnections documentation](https://nodejs.org/docs/latest-v24.x/api/http.html#serverclosecallback). The documentation distinguishes idle closure from forcefully closing active requests; closeAllConnections is deliberately not used.

## Final implementation and regression protections

- `app/api/application.ts`: tracks sockets until their first HTTP request; after stopping the listener destroys only sockets still without a request. Removes tracking when sockets close or begin a request. During shutdown, response finish triggers Node's idle-only connection cleanup. Existing response handling, database lifetime, server entry point, signal handling and fixture are preserved.
- `tests/api/lifecycle.spec.ts`: three real lifecycle regressions with server-side connection/data barriers, rather than sleeps or repeated browser races. Covers unused preconnect, incomplete headers, and active partial feedback plus unused connection. The latter completes the body after close begins, receives the complete 201 response and a positive safe ID, verifies exactly one row with exact trimmed fields, and opens an exclusive SQLite transaction after shutdown. Destroy-all or premature database-close implementations would fail the POST/row oracle.
- First GREEN-3 used a constant synthetic description. Controller identified the existing uniqueness requirement; final test uses randomUUID while retaining surrounding whitespace and the exact trimmed row comparison. No fixed Unicode/boundary fixture changed. Final focused run uses this corrected source.

## Commands and results

All commands run at the approved root in PowerShell. `D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0` is the pinned invocation throughout. JSON output is selected with PLAYWRIGHT_JSON_OUTPUT_NAME. Each test command also pipes combined output to its matching `.log` with Tee-Object and exits with LASTEXITCODE.

RED, before any production edit:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-results/sdd/portfolio-completion-2026-10-26/shutdown-red.json'
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 exec playwright test tests/api/lifecycle.spec.ts --project=api --workers=1 --retries=0 --reporter=list,json --output=test-results/sdd/portfolio-completion-2026-10-26/shutdown-red-artifacts 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-red.log
exit $LASTEXITCODE
```

Result: exit 1, 3 expected regression failures, each close predicate false. Native JSON, logs and traces retained. The active HTTP oracle was subsequently corrected as described above; the original RED does not claim the later exact test-file hash.

For each interim run the same lifecycle command was used, changing only all output prefixes:

| Prefix | Production state and oracle | Result |
| --- | --- | --- |
| shutdown-green | Never-requested cleanup; initial raw chunked HTTP oracle | 2 passed, 1 oracle SyntaxError; exit 1 |
| shutdown-green-2 | Same partial fix; corrected Node HTTP client, real keep-alive | 2 passed, 1 unresolved-close regression failure; exit 1 |
| shutdown-green-3 | Final production fix; corrected HTTP client, constant synthetic description | 3 passed; exit 0 |

Final focused verification after the UUID data correction:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME='test-results/sdd/portfolio-completion-2026-10-26/shutdown-focused.json'
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 exec playwright test tests/api/lifecycle.spec.ts tests/api/feedback.spec.ts tests/e2e/favourites.spec.ts tests/e2e/feedback.spec.ts --project=api --project=chromium --grep 'application shutdown|interrupted HTTP body|real failed feedback insertion|invalid/duplicate IDs normalize|repeated submit events while pending' --workers=1 --retries=0 --reporter=list,json --output=test-results/sdd/portfolio-completion-2026-10-26/shutdown-focused-artifacts 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-focused.log
exit $LASTEXITCODE
```

Result: exit 0, **7 passed, 0 skipped, 0 unexpected, 0 flaky**, duration 3923.179 ms; startTime 2026-10-27T17:30:41.166Z. Includes three lifecycle regressions, existing interrupted-body and real failed-insertion API cases, and both originally failing Chromium cases.

Build and typecheck ran before focus and again after the UUID-only test-data correction:

```powershell
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 build 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-final-build.log
exit $LASTEXITCODE
```

```powershell
& D:/programms/nodejs/npx.cmd --yes pnpm@11.19.0 typecheck 2>&1 | Tee-Object -FilePath test-results/sdd/portfolio-completion-2026-10-26/shutdown-final-typecheck.log
exit $LASTEXITCODE
```

Both final commands exit 0. Earlier corresponding logs are shutdown-build.log and shutdown-typecheck.log.

Sandbox limitations: the initial loopback probe failed EACCES before testing lifecycle behavior; rerunning outside sandbox with the authorized escalation succeeded. Initial sandbox npx build/typecheck processes stalled without output and were interrupted; outside-sandbox runs completed normally. These are environment attempts, not test failures or passing evidence.

## Readiness limits and evidence handoff

Source is frozen at the hashes above for fresh controller review. Evidence manifest: `test-results/sdd/portfolio-completion-2026-10-26/shutdown-evidence-hashes.json` (source identities, logs, JSON and retained local traces; excludes itself). Hosted raw evidence was not mutated. Controller-owned documentation and publication history were not changed by this worker.

No local full 583-case matrix was run or claimed. Three additional API regressions imply an expected future full count of 586, subject to actual test listing/hosted execution. Required 21 inventory entries and variants, all browsers, phone layout, smoke selection, workers1/retries0 and owned databases remain required. A final hosted pass, independent review, commit/publication and whole-portfolio readiness are controller work still outstanding. Local Windows execution does not prove Linux signal delivery or the exact remote TCP condition; final CI must supply that evidence.
