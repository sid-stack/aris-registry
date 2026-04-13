/**
 * Dev-only HTTP error interceptor.
 *
 * Monkey-patches window.fetch so every 4xx/5xx response is:
 *   1. Captured with the full response body
 *   2. Formatted in Python requests.HTTPError style
 *   3. Stored in module state for the DevErrorPanel component
 *   4. Re-logged to console.error with the body (not just the useless "status 400")
 *
 * Also intercepts window.onerror + unhandledrejection so resource-load
 * failures (scripts, images) from third-party tags show up the same way.
 *
 * Tree-shaken in production (import.meta.env.DEV guard).
 */

const IS_DEV = import.meta.env.DEV;

/** Module-level store — plain array, not React state */
const _store = [];
const _subs = new Set();

function _notify() {
  const snap = [..._store];
  _subs.forEach(fn => fn(snap));
}

/** Subscribe to error updates. Returns an unsubscribe fn. */
export function subscribeErrors(fn) {
  _subs.add(fn);
  fn([..._store]);
  return () => _subs.delete(fn);
}

export function clearErrors() {
  _store.length = 0;
  _notify();
}

/** Format like Python's requests.HTTPError */
function pythonStyle(method, url, status, statusText, body) {
  const tier = status >= 500 ? 'Server' : 'Client';
  const lines = [
    `HTTPError: ${status} ${tier} Error: ${statusText || 'Unknown'} for url: ${url}`,
  ];

  if (body?.trim()) {
    try {
      const parsed = JSON.parse(body);
      // Clerk surfaces errors as { errors: [{ message, long_message }] }
      if (Array.isArray(parsed.errors) && parsed.errors.length) {
        parsed.errors.forEach(e => {
          if (e.long_message) lines.push(`  Detail: ${e.long_message}`);
          else if (e.message) lines.push(`  Message: ${e.message}`);
        });
      } else if (typeof parsed.error === 'string') {
        lines.push(`  Error: ${parsed.error}`);
      } else if (typeof parsed.message === 'string') {
        lines.push(`  Message: ${parsed.message}`);
      } else {
        lines.push(`  Body: ${JSON.stringify(parsed, null, 2).slice(0, 600)}`);
      }
    } catch {
      lines.push(`  Body: ${body.slice(0, 400)}`);
    }
  }

  return lines.join('\n');
}

function _push(entry) {
  _store.unshift(entry);
  if (_store.length > 40) _store.pop();
  _notify();
}

function _isThirdParty(url) {
  if (!url) return true;
  return !url.startsWith('/') && !url.includes('localhost') && !url.includes('127.0.0.1');
}

// ─── Fetch interceptor ────────────────────────────────────────────────────────
if (IS_DEV && typeof window !== 'undefined') {
  const _orig = window.fetch.bind(window);

  window.fetch = async function devFetch(...args) {
    const [input, init] = args;
    const url =
      typeof input === 'string' ? input :
      input instanceof URL ? input.href :
      input?.url ?? String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const thirdParty = _isThirdParty(url);

    let res;
    try {
      res = await _orig(...args);
    } catch (netErr) {
      // CORS / offline — response body inaccessible
      if (!thirdParty) {
        _push({
          id: `${Date.now()}-net`,
          status: 0,
          method,
          url,
          message: `NetworkError: Failed to fetch\n  URL: ${url}\n  Cause: ${netErr.message}`,
          ts: new Date().toISOString(),
          thirdParty,
        });
      }
      throw netErr;
    }

    if (res.status >= 400) {
      // Clone so the original response is still readable by the caller
      res.clone().text().then(body => {
        const message = pythonStyle(method, url, res.status, res.statusText, body);
        _push({
          id: `${Date.now()}-${res.status}`,
          status: res.status,
          method,
          url,
          message,
          ts: new Date().toISOString(),
          thirdParty,
        });
        // Re-log with full body — replaces the cryptic "Failed to load resource"
        console.error(`[HTTP ${res.status}]\n${message}`);
      }).catch(() => {});
    }

    return res;
  };

  // ── Resource-load errors (scripts/images, e.g. fivebyfive) ─────────────────
  window.addEventListener('error', (e) => {
    const src = e.filename ?? e.target?.src ?? e.target?.href ?? '';
    if (!src || src === window.location.href) return; // skip JS errors
    _push({
      id: `${Date.now()}-res`,
      status: 0,
      method: 'RESOURCE',
      url: src,
      message: `ResourceError: Failed to load resource\n  URL: ${src}\n  Element: <${e.target?.tagName?.toLowerCase() ?? 'unknown'}>`,
      ts: new Date().toISOString(),
      thirdParty: _isThirdParty(src),
    });
  }, true);

  // ── Unhandled promise rejections ────────────────────────────────────────────
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message ?? String(e.reason ?? 'Unknown rejection');
    // Skip if already captured by fetch interceptor (fetch throws TypeError)
    if (msg.includes('Failed to fetch')) return;
    _push({
      id: `${Date.now()}-rej`,
      status: 0,
      method: 'PROMISE',
      url: window.location.href,
      message: `UnhandledRejection: ${msg}`,
      ts: new Date().toISOString(),
      thirdParty: false,
    });
  });
}
