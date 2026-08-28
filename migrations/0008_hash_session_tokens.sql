-- B2: sessions.id now stores the SHA-256 of the cookie token, not the token
-- itself (src/lib/auth.ts hashSessionToken). Existing rows hold raw tokens and
-- can never match a hashed lookup, so clear them — every active login is
-- flushed and users sign in again once.
DELETE FROM sessions;
