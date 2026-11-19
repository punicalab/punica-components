/**
 * The one place a URL from untrusted text is judged.
 *
 * Allowed: `http:`, `https:`, `mailto:` and relative URLs. Everything else
 * (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:` …) is refused, however
 * the scheme is disguised with white space, control characters or case.
 */

const ALLOWED = new Set(['http:', 'https:', 'mailto:']);
// Characters a browser's URL parser strips or ignores before it reads a scheme.
// Built from code points: a line separator inside a regex literal does not
// survive every bundler.
const span = (from, to) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`;
const INVISIBLE = new RegExp(
  `[${span(0x00, 0x20)}${span(0x7f, 0x9f)}${String.fromCharCode(0xad)}${span(0x200b, 0x200f)}${span(0x2028, 0x202f)}${String.fromCharCode(0x2060, 0xfeff)}]`,
  'g'
);
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const BASE = 'https://punica.invalid/';

/**
 * @param {unknown} raw a URL as written by an author or a model
 * @returns {{ href: string, external: boolean } | null} null when the URL must
 *   not be used; `external` is true for an http(s) URL on another origin
 */
export function safeUrl(raw) {
  if (typeof raw !== 'string') return null;
  const href = raw.trim();
  if (!href) return null;
  const scheme = SCHEME.exec(href.replace(INVISIBLE, ''));
  if (scheme && !ALLOWED.has(scheme[1].toLowerCase() + ':')) return null;
  let parsed;
  try {
    // Parsed the way the browser will parse it, as a second opinion.
    parsed = new URL(href, BASE);
  } catch {
    return null;
  }
  if (!ALLOWED.has(parsed.protocol)) return null;
  let external = false;
  if (parsed.protocol !== 'mailto:' && typeof location !== 'undefined') {
    try {
      external = new URL(href, document.baseURI).origin !== location.origin;
    } catch {
      external = true;
    }
  }
  return { href, external };
}
