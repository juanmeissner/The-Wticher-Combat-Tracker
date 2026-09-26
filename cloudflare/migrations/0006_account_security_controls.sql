PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS account_devices (
    user_id TEXT NOT NULL,
    device_id_hash TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'Dispositivo',
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    revoked_at TEXT,
    revoked_by TEXT,
    PRIMARY KEY (user_id, device_id_hash),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_devices_user_seen
    ON account_devices(user_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS account_blocks (
    user_id TEXT PRIMARY KEY,
    reason TEXT NOT NULL DEFAULT 'Bloqueio administrativo',
    blocked_at TEXT NOT NULL,
    blocked_by TEXT NOT NULL DEFAULT 'admin',
    expires_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account_rate_limits (
    scope TEXT NOT NULL,
    subject_hash TEXT NOT NULL,
    window_started_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (scope, subject_hash)
);

CREATE INDEX IF NOT EXISTS idx_account_rate_limits_updated
    ON account_rate_limits(updated_at);
