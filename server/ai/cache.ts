import crypto from "crypto";

/**
 * Lightweight in-process LRU cache for search results.
 *
 * Keyed by a SHA-256 hash of the search query so identical queries
 * across multiple graph invocations never hit the SerpAPI again within the TTL.
 *
 * Design decisions:
 *  - Uses a Map for O(1) get/set/delete.
 *  - LRU eviction via manual reordering (Map preserves insertion order).
 *  - No external dependency (no Redis) — safe for single-instance deployment.
 *    For multi-instance / horizontal scaling, swap the Map for a Redis client here.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class LRUCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number
  ) {}

  /** Deterministic hash so query normalization is consistent */
  static hashKey(raw: string): string {
    return crypto.createHash("sha256").update(raw.trim().toLowerCase()).digest("hex").slice(0, 16);
  }

  get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);  // Lazy expiry
      return null;
    }

    // Refresh position (LRU: move to end)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.map.has(key)) this.map.delete(key); // Remove stale position

    // Evict oldest entry if over capacity
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }

    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  get size(): number {
    return this.map.size;
  }
}

// ── Singleton instances ────────────────────────────────────────────────────────

/**
 * Search result cache.
 * Holds up to 200 unique queries for 30 minutes.
 * A SerpAPI Google Images call costs ~$0.001; caching pays for itself quickly.
 */
export const searchCache = new LRUCache<any[]>(200, 30 * 60 * 1000);

/**
 * Vision description cache.
 * Holds up to 100 unique image URLs / data-URIs for 60 minutes.
 * Gemini vision calls are significantly more expensive than search calls.
 */
export const visionCache = new LRUCache<{ description: string; searchQuery: string }>(
  100,
  60 * 60 * 1000
);

export { LRUCache };
