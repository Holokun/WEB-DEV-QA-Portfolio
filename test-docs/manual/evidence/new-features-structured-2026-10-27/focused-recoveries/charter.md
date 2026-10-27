# Focused corrective structured QA charter — 2026-10-27

Recorded before execution. Codex independent data-check worker; structured automated agent QA, not human/manual/exploratory/native AT.

Review found that original FEEDBACK-HTTP500 and FEEDBACK-ABORT real successful recovery posts reused one nonboundary description. Their functional/SQL assertions passed, but the unique-description test-data convention was not satisfied. Preserve every original raw artifact and original SHA-256 manifest unchanged.

Run only those two recovery scenarios anew, serially, on the unchanged recorded build/source 94779ebd20c08e763ec0c99cae4aa0dbb4238af7, with a fresh owned absolute SQLite file and available local port. Use distinct synthetic descriptions containing run timestamp and failure mode, including surrounding spaces. In each case: inject HTTP 500 or abort; verify selected game and raw email/description exactly preserved and zero inserted rows; remove interception and submit a real retry; require POST201 positive safe numeric ID, +1 row, and exact trimmed fields queried by returned ID in the same DB. Verify accepted descriptions differ across both focused variants and from every original accepted nonboundary description.

Retain exact raw inputs/request/response/SQL, trace/screenshots, native stdout, source/build identity and a separate recursive byte/SHA-256 manifest. No full 120 re-run, no product/dependency/Git/launch/gate changes, no .gitattributes edits or native actions. Scope completeness must be reported as 118 original conforming cases plus two corrected focused cases across separate runs; 122 completed executions historically, excluding interrupted harness attempt.
