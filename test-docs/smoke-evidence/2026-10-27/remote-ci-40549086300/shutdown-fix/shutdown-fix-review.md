# Independent shutdown-fix review

Date: 2026-10-27. Reviewer: Codex shutdown_fix_review subagent. Applied requesting-code-review and guard-approved-plan. Read-only code/evidence review; no tests, builds, installation, source edits, commits, publication or screen-reader actions performed. Only this review file was written.

## Scope and identity

Base HEAD: `e61f22db2a60090690824a388ad3a109e7033df4`. Reviewed the working diff in `app/api/application.ts`, new `tests/api/lifecycle.spec.ts`, their immediate HTTP/feedback/database fixture context, approved plan constraints, `shutdown-fix-report.md`, native RED/interim/focused JSON and final compiler logs. Recomputed every source/evidence hash listed by `shutdown-evidence-hashes.json`; all matched. Rechecked source identity before writing this verdict:

- `app/api/application.ts`: `dff9e83f212ddf0a68fa3d5363e50e104621be95dc11c7998a0ba1ed0ddbce4f`.
- `tests/api/lifecycle.spec.ts`: `53c9ce743da168c9faf8caf4545ce8f8eb3683200dfaea99f504a633ac731028`.

## Finding: P2 — reused sockets with incomplete next headers remain unclosed

Location: `app/api/application.ts:21` (permanent removal from `unrequestedSockets`), with shutdown iteration at lines 73–77.

After one complete HTTP exchange, the connection is permanently removed from the application's tracking set. If the same keep-alive connection starts a second request but stops during its headers, shutdown does not destroy it: the socket is absent from the set, no second application `request`/response-finish event exists, and Node treats its partial parser message as active rather than idle. `server.close()` can therefore remain pending beyond the unchanged fixture's 10-second stop budget. This is an uncovered variant of the pre-existing shutdown defect, not a newly introduced regression or proof of the hosted socket's identity.

The conclusion follows directly from the pinned runtime implementation: [Node v24.22.1 parser source](https://github.com/nodejs/node/blob/v24.22.1/src/node_http_parser.cc#L289-L307) sets `last_message_start_` when parsing begins, while its idle-list implementation (lines 1109–1124) includes only zero timestamps. [Node v24.22.1 HTTP server source](https://github.com/nodejs/node/blob/v24.22.1/lib/_http_server.js#L652-L664) closes only that idle list. A partial subsequent header therefore has the same parser obstacle as the first-request partial-header regression, but lacks the application's manual cleanup. This is static source evidence; the reviewer did not execute a reproduction.

Requested fix/verification: add a deterministic case that completes one keep-alive request, sends server-observed partial next headers on that same socket, then starts shutdown and verifies completion/client closure. Retain socket lifecycle tracking after the first request, distinguishing sockets with an emitted request/unfinished response from sockets with no outstanding application request; preserve the active POST/body/response/SQL drain oracle. A per-socket count must handle pipelined requests if used. Prove RED/GREEN for the reused-header variant, then re-review the changed source and report. Do not replace the fix with forced destruction of every socket or a timeout/retry change.

## Evidence and quality assessment

- Scope preserves vanilla TypeScript/Node HTTP/SQLite, root/main, dependencies, launch/configuration, serial owned databases, existing fixtures, assertions and readiness gates. No silent contract deviation found.
- The three initial native RED cases fail on unresolved shutdown, not setup; the initial raw chunked-response oracle SyntaxError is correctly preserved and separated from product RED evidence. Corrected HTTP-client evidence then shows the active-to-idle shutdown failure before the final production addition.
- Final native focused JSON records seven passed, zero skipped/unexpected/flaky, workers 1 and retries 0: three new lifecycle cases, interrupted-body and real SQL-insertion-failure API cases, and both Chromium cases that failed hosted teardown. Final build/typecheck logs contain successful compiler commands; these are implementer execution evidence, not independently rerun checks.
- Server acceptance/data barriers make the new failure scenarios deterministic. The active feedback regression completes the body after close starts, receives a full HTTP 201 response through Node's HTTP client, validates a positive safe ID and exactly one SQL row with exact trimmed fields and a unique nonboundary description. It would catch destructive interruption or premature database closure affecting that transaction.
- Database closure remains after the server-close callback in `finally`; tracked socket references are removed on socket close. The idle-only response-finish sweep is conditional on shutdown, preserving normal keep-alive behavior. A previously used connection with a fully emitted active request is also protected from the manual destroy loop; the incomplete next-header gap above is the missing lifecycle state.
- The post-close exclusive SQLite transaction demonstrates no surviving lock from this scenario; it does not by itself prove no extra idle SQLite connection exists. Code inspection supplies the database-close ordering evidence. Test `finally` blocks destroy their clients and request application cleanup, although idempotent early-return behavior of a second `close()` call is unchanged from base.

## Verdict and limits

**Changes requested for the P2 shutdown-completeness gap above.** No other actionable finding in the scoped production/test diff.

The report correctly distinguishes a proven local defect consistent with hosted failures from identification of the exact hosted socket; the traces contain no TCP socket telemetry. This review is not a full matrix pass, a Linux signal-handling verification or a portfolio readiness claim. The new full count is expected to be 586 only; an actual final hosted green run remains required. The controller has relayed the owner's explicit readiness amendment removing actual screen-reader verification as a release gate while retaining truthful claims; this review does not reintroduce that gate or claim speech output passed.
