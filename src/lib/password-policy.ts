import commonPasswords from "./data/common-passwords.json";

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 1024;
export const PASSWORD_HINT = "Use 15–1,024 characters. Choose a unique passphrase; common passwords are rejected.";
export const PASSWORD_ERRORS: Record<string, string> = {
  password_too_short: "Use at least 15 characters for your new password.",
  password_too_long: "Use no more than 1,024 characters for your new password.",
  password_common: "That password is too common. Choose a different, unique passphrase.",
};

const blocked = new Set([...commonPasswords, "stonedragonmedia", "stone dragon media", "stonedragonmedia123"]);

/** Screen complete passwords locally; never send them to a lookup service. */
export function passwordError(password: string): "password_too_short" | "password_too_long" | "password_common" | null {
  const normalized = password.normalize("NFC");
  const length = Array.from(normalized).length;
  if (length < PASSWORD_MIN_LENGTH) return "password_too_short";
  if (length > PASSWORD_MAX_LENGTH) return "password_too_long";
  if (blocked.has(normalized.toLowerCase())) return "password_common";
  return null;
}
