# BUG-API-01 — Feedback allocation committed an unsafe response ID

Status: fixed before the feedback API feature commit. Severity: medium; an extreme preserved SQLite counter violated the positive safe integer response contract and could lose exact ID representation. Requirements: REQ-API-07/06 and no-error-insertion. Regression: allocation counter boundary variants in `tests/api/feedback.spec.ts`.

Discovery: assistant review of the uncommitted Task 1 draft and a focused in-memory handler experiment, followed by two failing API regression variants. This was not a shipped defect or a finding from Vadim's historical manual session. Record prepared on 2026-10-13 (Asia/Yerevan); no independent occurrence timestamp is claimed.

Reproduce against that draft using an isolated database: insert one synthetic feedback row, set its `sqlite_sequence` counter to `9007199254740991`, start without resetting, then POST a valid known-game body. Actual: HTTP 201 with `id: 9007199254740992`, a committed row with that exact SQLite ID and an advanced counter; `Number.isSafeInteger(id)` is false. Later IDs can also round to a different Number. Expected: generic HTTP 500 and unchanged rows/counter because a safe response ID cannot be allocated. Companion setup at `9007199254740990` requires one successful maximum-safe ID before rejecting the next allocation.

The counter setup deliberately makes an otherwise impractical boundary reachable; it is not a report of naturally accumulated feedback or a startup/reset defect. Existing counters must be preserved on startup. The defect was the unconditional Number conversion after insertion.

Fix: perform allocation in an immediate transaction, validate the returned ID, commit only a positive safe integer, and roll back before propagating any allocation error. The tests compare complete database/counter snapshots, verify the last safe success and verify a subsequent repeated rejection does not insert.

Native evidence: [two failing boundary variants](../test-docs/favourites-feedback-evidence/2026-10-13/unsafe-id-red.log), [156 passing API/database checks after the fix](../test-docs/favourites-feedback-evidence/2026-10-13/unsafe-id-green.log). Original review/fix records remain in `test-results/sdd/favourites-feedback-2026-10-12/task-1-review.md`, `task-1-fix-1-package.md` and `task-1-fix-1-review.md`. These are native automated HTTP/SQL results; no manual execution or screenshot is asserted.
