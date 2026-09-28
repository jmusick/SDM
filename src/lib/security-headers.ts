/**
 * Security response headers.
 *
 * `public/_headers` carries the same set for the prerendered marketing pages
 * (served straight from Pages' asset storage, which never hits the worker or
 * this middleware). Keep the two in sync — the CSP below is the source of
 * truth; `_headers` is a hand-copy of it.
 *
 * CSP allowances in use:
 *   - Google Fonts       — styles from fonts.googleapis.com, files from fonts.gstatic.com
 *   - Google Analytics   — gtag from googletagmanager.com, beacons to google-analytics.com
 *   - hCaptcha           — contact form widget (script + challenge iframe + styles)
 *   - Web3Forms          — contact form submission (fetch to api.web3forms.com)
 *   - 'unsafe-inline' script/style — Astro inlines small module scripts and component
 *     styles with per-build hashes; nonces aren't available from a static _headers file.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://hcaptcha.com https://*.hcaptcha.com",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.hcaptcha.com https://hcaptcha.com https://*.hcaptcha.com",
  "connect-src 'self' https://api.web3forms.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://hcaptcha.com https://*.hcaptcha.com",
  "frame-src https://hcaptcha.com https://*.hcaptcha.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP,
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
};

/** Set the security headers on an SSR response, without clobbering anything already set. */
export function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  return response;
}
