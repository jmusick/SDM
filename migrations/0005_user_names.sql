-- Optional first/last name for display, so a user's identity can show as a name instead of email.
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
