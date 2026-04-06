import { RateLimitError } from '@/lib/errors'

interface RateLimitEntry {
  count: number
  resetAt: number
  lockedUntil?: number
}

const store = new Map<string, RateLimitEntry>()

function getKey(identifier: string, endpoint: string): string {
  return `${endpoint}:${identifier}`
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
  /** If true, after limit is reached, lock out for lockoutMs */
  lockout?: boolean
  /** Lockout duration in milliseconds */
  lockoutMs?: number
}

export function checkRateLimit(identifier: string, endpoint: string, config: RateLimitConfig): void {
  const key = getKey(identifier, endpoint)
  const now = Date.now()
  const entry = store.get(key)

  if (entry) {
    if (entry.lockedUntil && now < entry.lockedUntil) {
      const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000)
      throw Object.assign(new RateLimitError(`Too many requests. Try again in ${retryAfter} seconds`), {
        retryAfter,
      })
    }

    if (now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs })
      return
    }

    if (entry.count >= config.limit) {
      if (config.lockout && config.lockoutMs) {
        entry.lockedUntil = now + config.lockoutMs
        store.set(key, entry)
        const retryAfter = Math.ceil(config.lockoutMs / 1000)
        throw Object.assign(new RateLimitError(`Too many attempts. Try again in ${retryAfter} seconds`), {
          retryAfter,
        })
      }
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      throw Object.assign(new RateLimitError(`Rate limit exceeded. Try again in ${retryAfter} seconds`), {
        retryAfter,
      })
    }

    entry.count++
    store.set(key, entry)
  } else {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
  }
}

export const RATE_LIMITS = {
  authLogin: { limit: 5, windowMs: 15 * 60 * 1000, lockout: true, lockoutMs: 15 * 60 * 1000 },
  authRegister: { limit: 3, windowMs: 60 * 60 * 1000 },
  invitations: { limit: 100, windowMs: 60 * 60 * 1000 },
  fileUpload: { limit: 10, windowMs: 60 * 60 * 1000 },
  apiGlobal: { limit: 100, windowMs: 60 * 1000 },
} satisfies Record<string, RateLimitConfig>

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
