/**
 * src/lib/rateLimit.ts
 * Rate limiting in-memory per API routes.
 * Produzione: sostituire con Redis (Upstash) per scalabilita multi-instance.
 *
 * Uso: await rateLimit(req, { limit: 10, window: 60 })
 */

interface RateLimitEntry { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  limit: number   // max richieste
  window: number  // secondi finestra
}

/**
 * Ritorna true se la richiesta supera il rate limit.
 * Usa IP come chiave (o header X-Forwarded-For in produzione con proxy).
 */
export function isRateLimited(
  identifier: string,
  opts: RateLimitOptions = { limit: 20, window: 60 }
): boolean {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + opts.window * 1000 })
    return false
  }

  if (entry.count >= opts.limit) return true

  entry.count++
  return false
}

/** Estrae identificatore IP dalla request */
export function getRequestIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

// Pulizia periodica store (ogni 5 minuti in produzione)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((v, k) => { if (v.resetAt < now) store.delete(k) })
  }, 5 * 60 * 1000)
}
