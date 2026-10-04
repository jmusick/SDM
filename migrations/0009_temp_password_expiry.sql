-- Legacy temporary credentials have no issuance time. Expire them rather than
-- inventing one; administrators can deliberately issue a new temporary password.
ALTER TABLE users ADD COLUMN temporary_password_expires_at INTEGER;
UPDATE users SET temporary_password_expires_at = 0 WHERE must_change_password = 1;
