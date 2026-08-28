-- Admin-provisioned accounts (client create + password reset) must change the
-- temporary password on first login. Enforced in middleware until it's cleared.
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;

-- One-time reveal of a temporary password. The plaintext lands here — not in the
-- redirect URL query string — is shown once on the client page, then deleted.
-- Short TTL so an unopened row doesn't linger.
CREATE TABLE password_flash (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  temp_password TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
