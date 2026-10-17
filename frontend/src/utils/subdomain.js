/**
 * Extracts and returns the store slug from the current browser subdomain.
 * Examples:
 * - "amits-wear.shopsflow.in" -> "amits-wear"
 * - "amits-wear.localhost" -> "amits-wear"
 * - "shopsflow.in" / "www.shopsflow.in" -> null
 */
export function getSubdomainSlug() {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;

  // Skip pure IP addresses (e.g. 127.0.0.1)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');

  // e.g. amits-wear.shopsflow.in
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    const systemSubdomains = ['www', 'api', 'admin', 'mail', 'cpanel', 'webmail', 'staging'];
    if (!systemSubdomains.includes(sub)) {
      return sub;
    }
  } else if (parts.length === 2 && parts[1] === 'localhost') {
    // Local dev testing: e.g. amits-wear.localhost:5173
    return parts[0].toLowerCase();
  }

  return null;
}
