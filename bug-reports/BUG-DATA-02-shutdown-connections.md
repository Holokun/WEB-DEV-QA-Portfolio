# BUG-DATA-02 — HTTP connections can prevent owned application shutdown

Severity: moderate lifecycle/reliability issue. Priority: P2. Status: corrected locally; final hosted confirmation belongs to the new-source CI run.

Observed build: `e61f22db2a60090690824a388ad3a109e7033df4`, Node24.22.1. Hosted Ubuntu24.04 Chromium tests in [run40549086300](https://github.com/Holokun/WEB-DEV-QA-Portfolio/actions/runs/40549086300) completed their UI/SQL assertions, then two failed with `Owned app failed to stop` after the unchanged10-second fixture deadline. All581 other full cases and all15 smoke cases passed. The exact remote socket identity was not captured.

## Reproduction

Use a dedicated owned database and `createApplication`, listen on an available loopback port, and wait until the server accepts a real TCP connection. Send no HTTP request, then call `app.close()`. On the original implementation the listener stops accepting connections, but close remains unresolved until the client destroys its socket. A deterministic2-second regression assertion exposes this; no browser race or increased timeout is required.

A second deterministic variant first completes a real GET200 on a keep-alive connection, sends incomplete headers for the next request on that same socket, waits for server-side data, then closes the application. The first proposed fix missed this reused-connection variant; independent review caught it and a separate failing regression confirmed it before correction.

Expected: shutdown releases connections without a parsed active request and waits for already received valid requests to finish. A valid feedback POST started before shutdown must still return its complete201 response and persist exactly one correct row before SQLite closes.

Actual: Node's close operation could continue waiting on an unrequested or partially parsed connection, preventing application/process termination. The fixture correctly reported the pending exit; it was not repaired by extending its timeout. Ordinary browsing or data loss was not established by the hosted failure.

## Cause and correction

The application previously awaited only `server.close()`. Node's parser can treat incomplete headers as active even though no application request callback exists. Tracking only sockets that have never emitted a request was insufficient for reused keep-alive connections.

The final correction tracks current request lifetimes per accepted socket, retaining entries across reuse. It releases requests only after both their complete body and finished response; shutdown destroys only sockets with no parsed active request and lets active feedback drain. Completed responses during shutdown end their drained connection and ask Node to close idle connections. SQLite closes after the server close callback.

## Verification and evidence

- Original deterministic RED: three unresolved-close failures. The first intermediate active-response oracle incorrectly parsed chunked framing; that separate test-oracle failure is retained and not counted as a product defect.
- Review correction RED: one real reused-connection unresolved-close failure before the final production change.
- Final source: four lifecycle regressions passed; the two originally failed Chromium cases passed separately. Build/typecheck passed. The active POST test checks the real safe201 ID, unique synthetic description, exact trimmed SQL row and an exclusive transaction after shutdown.
- Full future inventory is expected to contain587 executions because four API regressions were added; this is not a claim of a completed full run.

See the [repair report](../test-docs/shutdown-repair-results.md), [original failed hosted JSON](../test-docs/smoke-evidence/2026-10-27/remote-ci-40549086300/full/playwright.json) and its [HTML/traces](../test-docs/smoke-evidence/2026-10-27/remote-ci-40549086300/full/html/index.html). The reproduced mechanisms are consistent with the hosted teardown symptom; the missing remote socket telemetry must not be invented retrospectively.
