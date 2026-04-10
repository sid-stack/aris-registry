/**
 * Audit Result Cache — 24-hour result cache keyed by solicitation URL.
 *
 * Hierarchy:
 *   1. Upstash Redis  (if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN configured)
 *   2. In-process Map (single-instance fallback — survives restarts only until process death)
 *
 * Keys:    audit:result:{sha256(normalizedInput).slice(0,40)}
 * TTL:     86400s (24h)
 * Max local entries: 150 (LRU-ish eviction)
 *
 * Usage:
 *   import { getAuditCache, setAuditCache } from './auditCache.js';
 *
 *   const cached = await getAuditCache(url);
 *   if (cached) return res.json({ ...cached, cache_hit: true, cache_served_at: new Date().toISOString() });
 *   const result = await runAudit(...);
 *   await setAuditCache(url, result);
 */

import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger.js';

const CACHE_TTL   = 86_400; // 24 hours in seconds
const LOCAL_MAX   = 150;    // max in-memory entries before eviction
const KEY_PREFIX  = 'audit:result:';

// ── Redis client (optional) ────────────────────────────────────────────────────
let redis = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  logger.warn('audit_cache_redis_init_failed', { error: e.message });
}

// ── In-memory LRU-ish fallback ─────────────────────────────────────────────────
// Entries: Map<key, { data: object, expiresAt: number }>
const localCache = new Map();

function makeKey(input) {
  const normalized = typeof input === 'string' ? input.trim().toLowerCase() : JSON.stringify(input);
  return KEY_PREFIX + crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 40);
}

function localGet(key) {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }
  return entry.data;
}

function localSet(key, data) {
  if (localCache.size >= LOCAL_MAX) {
    // Evict the oldest entry (insertion order)
    const oldest = localCache.keys().next().value;
    localCache.delete(oldest);
  }
  localCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL * 1_000 });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Look up a cached audit result.
 * @param {string} input  Normalized solicitation URL (or text hash).
 * @returns {object|null} Cached audit result, or null on miss.
 */
export async function getAuditCache(input) {
  const key = makeKey(input);

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.info('audit_cache_hit', { tail: key.slice(-8), source: 'redis' });
        return typeof cached === 'object' ? cached : JSON.parse(cached);
      }
    } catch (e) {
      logger.warn('audit_cache_redis_read_failed', { error: e.message });
    }
  }

  const local = localGet(key);
  if (local) {
    logger.info('audit_cache_hit', { tail: key.slice(-8), source: 'local' });
    return local;
  }

  return null;
}

/**
 * Store an audit result in the cache.
 * @param {string} input  Same key used in getAuditCache.
 * @param {object} data   The audit result to cache.
 */
export async function setAuditCache(input, data) {
  const key = makeKey(input);

  localSet(key, data);

  if (redis) {
    try {
      await redis.set(key, data, { ex: CACHE_TTL });
    } catch (e) {
      logger.warn('audit_cache_redis_write_failed', { error: e.message });
    }
  }
}

/**
 * Diagnostic stats for the /api/health endpoint.
 */
export function auditCacheStats() {
  return {
    local_entries: localCache.size,
    redis_enabled: !!redis,
    ttl_hours: CACHE_TTL / 3600,
  };
}
