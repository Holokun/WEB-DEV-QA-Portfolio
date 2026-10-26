-- Read-only verification against the explicit owned DB_PATH used by the run.
-- Bind :feedback_id to the actual 201 response ID; never assume ID 1 or use MAX(id)
-- as a substitute. Capture count before/after each request: +1 on acceptance,
-- unchanged on rejection. SQL results supplement real HTTP/UI assertions.
PRAGMA user_version;
SELECT id, title, genre, description, release_year, platforms FROM games ORDER BY id;
SELECT id, game_id, version, summary, published_at
FROM patch_notes ORDER BY game_id, published_at DESC, id DESC;
SELECT COUNT(*) AS games FROM games;
SELECT COUNT(*) AS patch_notes FROM patch_notes;
SELECT COUNT(*) AS feedback FROM feedback;
SELECT id, game_id, email, description FROM feedback WHERE id = :feedback_id;
SELECT name, CAST(seq AS TEXT) AS seq FROM sqlite_sequence ORDER BY name;
-- Text casts retain exact counter/ID evidence beyond JavaScript safe integers.
SELECT CAST(id AS TEXT) AS id, game_id, email, description FROM feedback ORDER BY id;
-- For the isolated reset checks: compare the entire snapshot before/after a
-- failed reset; after successful reset compare every fixture v1 field, require
-- no feedback/feedback sequence entry, then require next accepted ID 1.
