-- Per-account brute-force lockout: track consecutive failed logins and a lockout expiry.
ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until INTEGER;
