PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS firebase_identities (
    firebase_uid TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL COLLATE NOCASE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    provider_ids_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_firebase_identities_email
    ON firebase_identities(email COLLATE NOCASE);
