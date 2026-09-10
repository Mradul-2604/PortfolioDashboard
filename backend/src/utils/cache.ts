// ─── In-Memory TTL Cache ──────────────────────────────────────────────────────
// Generic, reusable cache with per-key TTL expiry.
// No external dependencies. Expiry is evaluated lazily on get().
//
// Design choice: lazy expiry (checked on get) rather than an interval-based
// sweep keeps the implementation simple without a setInterval that would
// prevent clean process shutdown.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;  // Date.now() + ttl
}

export class Cache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  /**
   * Retrieve a cached value.
   * Returns undefined if the key does not exist or the entry has expired.
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      // Lazy expiry: delete stale entry on access
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Store a value with a TTL in milliseconds.
   * @param key   Cache key
   * @param value Value to store
   * @param ttl   Time-to-live in milliseconds
   */
  set(key: string, value: T, ttl: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /** Remove a specific key from the cache. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Remove all entries from the cache. */
  clear(): void {
    this.store.clear();
  }

  /** Returns the number of entries currently in the cache (including stale). */
  size(): number {
    return this.store.size;
  }

  /**
   * Returns true if the key exists and is not expired.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}
