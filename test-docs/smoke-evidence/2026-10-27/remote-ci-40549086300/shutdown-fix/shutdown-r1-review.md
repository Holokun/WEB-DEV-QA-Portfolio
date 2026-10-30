# Independent shutdown R1 review

Date: 2026-10-27. Reviewer: Codex shutdown_r1_review. Applied guard-approved-plan and requesting-code-review. This is a scoped read-only implementation/evidence review; only this report was written. No tests, builds, installs, source changes, commits, pushes, Narrator actions or subagents were performed. The explicit review-only restriction takes precedence over any skill instruction to rerun tests; runtime results below are inspected implementer evidence, not independently executed checks.

## Scope and source identity

Reviewed `app/api/application.ts`, all four `tests/api/lifecycle.spec.ts` cases, immediate feedback/fixture context, the prior P2 review, R1 implementation report, native R1 JSON/logs and evidence manifest. Checkout remains `main` at base HEAD `e61f22db2a60090690824a388ad3a109e7033df4`, with the reviewed changes in the working tree. Recomputed SHA-256 and byte length for all 49 source/evidence entries in `shutdown-evidence-hashes-r1.json`: all match.

- Application: `b55bcff2e9500ed90530a596b8bf8058e84ab6bbb4177c70356d184773402541`.
- Lifecycle tests: `850f3a10591b9f563107496da569bf9239da06542bd75148e026020d9bb03103`.
- Built application: `c909cfb015ed3e22be524e1a12b30dd5d4833eafb55c3868621779744a81a92d`.

## Assessment of the prior P2

**Addressed.** Accepted sockets remain in the map until socket close (`application.ts:79-81`), including after a first successful request. Each emitted request increments the socket's active count; its guarded release decrements exactly once after both the complete body and response finish (`application.ts:22-39`). Shutdown destroys only zero-count sockets (`application.ts:88-92`). Thus the previous keep-alive GET followed by incomplete second headers remains tracked with count zero and is closed.

The new regression (`lifecycle.spec.ts:48-80`) uses a real keep-alive Agent, checks a successful GET 200, writes partial second headers on that same client socket, and waits for server-side receipt before close. Native R1 RED records the expected shutdown-predicate failure at line 72 before the production revision; native R1 GREEN records this case passing afterward. This supplies the requested deterministic reproduction and correction evidence without confusing the historical chunked-response-oracle error with product RED.

## Strengths and correctness checks

- The per-socket count protects overlapping parsed requests rather than treating the first finished response as proof the entire connection is idle. The one-shot release guard prevents double decrement; a socket close deletes its tracking entry. The release path does not recreate a deleted map entry.
- A parsed active request is excluded from forced shutdown destruction. When its complete body and response finish have both occurred during shutdown, the zero-count socket is ended and idle cleanup runs (`application.ts:25-38`). This also releases a drained connection carrying partial subsequent headers. Normal keep-alive behavior is unchanged while the application is open.
- The active feedback regression (`lifecycle.spec.ts:82-131`) starts close after part of the actual POST body arrives, sends the rest afterward, receives a complete HTTP 201 through Node's HTTP client, validates a positive safe ID and exactly one SQLite row with exact trimmed unique input, and verifies an exclusive transaction afterward. It also checks the unused socket closes. This is a meaningful end-to-end guard against truncating the active request/response or closing its database prematurely.
- Database closure remains in `finally` after the awaited HTTP server-close callback (`application.ts:88-94`). The exclusive-transaction assertion demonstrates no surviving lock in that scenario; code inspection, rather than that assertion alone, establishes explicit database-close ordering.
- No fixture, timeout, retry, skip, assertion weakening, configuration or dependency change was found in the scoped diff. The implementation retains the approved root/main, Node HTTP/SQLite/vanilla TypeScript arrangement and launch contract.

## Evidence inspected

- `shutdown-r1-red.json` and log: one expected regression failure, zero skipped/flaky, with the shutdown predicate still false after its unchanged 2-second limit.
- `shutdown-r1-lifecycle-green.json` and log: **4 passed**, zero unexpected/skipped/flaky; workers 1, retries 0.
- `shutdown-r1-chromium-green.json` and log: **2 passed**, zero unexpected/skipped/flaky; workers 1, retries 0. These are the two original hosted teardown-failure cases.
- R1 build/typecheck logs contain the successful compiler commands; the implementer records exit 0 for both and for `git diff --check`.

The prior focused **7/7** belongs to the previous implementation. It is not current R1 verification. Current retained runtime verification is **4 lifecycle + 2 Chromium**. No full matrix was executed by this reviewer or in the R1 local evidence. **587** remains an expected future full count, not an observed full pass.

## Declined to judge

- Forced cancellation of an already parsed request whose client never finishes its body: this local application correction preserves active drain; hostile-client deadlines, authentication and public-service hardening are outside the approved shutdown scope.
- Changing the existing concurrent/repeated `close()` return semantics: the early-return behavior predates this correction; no new caller contract was introduced.
- Full Linux signal/browser-matrix readiness and the exact TCP identity behind the historical hosted failure: those require controller-owned latest-source CI or telemetry and are not established by this scoped local evidence.
- Real screen-reader execution as a completion gate: the owner's prospective decision in `docs/superpowers/plans/2026-10-27-owner-readiness-decision.md` explicitly removes that gate. This review neither reinstates it nor claims unexecuted speech checks passed.

## Findings and verdict

**PASS for this scoped shutdown re-review.** No remaining actionable P2 from the previous review and no new material implementation defect found in the reviewed shutdown/test change. No Critical, Important or Minor revision is requested.

The shutdown correction is suitable to proceed to the controller's required latest-source CI and remaining acceptance work. This verdict is a code/evidence review, not a portfolio completion claim, a fresh independent runtime run, or a full-matrix pass. Historical reports and native evidence remain unchanged.
