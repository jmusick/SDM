/**
 * Client-side helper for the portal's screen-reader live region.
 *
 * `AdminLayout` and `DashboardLayout` each render one visually hidden
 * `#portal-announcer` (`role="status"`, `aria-live="polite"`). Anything the
 * page changes without a navigation — moving a kanban task, a failed save —
 * should report its result through `announce()`, success and failure alike,
 * so a screen-reader user isn't left guessing.
 */
export function announce(message: string): void {
  const region = document.getElementById("portal-announcer");
  if (!region) return;
  // Clear first, then set on the next frame: repeating the same text into a
  // live region that already holds it isn't re-announced otherwise.
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}

/**
 * Announce any server-rendered `.notice` in `<main>` (a save/error result
 * shown after a POST + redirect). Text already present at page load isn't
 * read out by a live region, so it's copied in after the page settles.
 */
export function announcePageNotices(): void {
  const text = Array.from(document.querySelectorAll<HTMLElement>("main .notice"))
    .filter((el) => !el.hidden)
    .map((el) => el.textContent?.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
  if (text) window.setTimeout(() => announce(text), 500);
}
