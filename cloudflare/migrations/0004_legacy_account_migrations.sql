PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS legacy_account_migrations (
    user_id TEXT PRIMARY KEY,
    firebase_uid TEXT NOT NULL UNIQUE,
    firebase_email TEXT NOT NULL COLLATE NOCASE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed')),
    moved_campaigns INTEGER NOT NULL DEFAULT 0,
    preserved_campaigns INTEGER NOT NULL DEFAULT 0,
    revoked_sessions INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_legacy_account_migrations_completed
    ON legacy_account_migrations(status, completed_at DESC);
