import { Cache } from "../utils/cache";

describe("Cache", () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache<string>();
  });

  // ─── get / set ───────────────────────────────────────────────────────────────

  it("returns undefined for a missing key", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("returns the stored value within TTL", () => {
    cache.set("key1", "value1", 5000);
    expect(cache.get("key1")).toBe("value1");
  });

  it("returns undefined after TTL expires", () => {
    // TTL of 1ms — will be expired immediately
    cache.set("key2", "expiredValue", 1);
    // Advance time by 2ms
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cache.get("key2")).toBeUndefined();
        resolve();
      }, 5);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  it("deletes a key correctly", () => {
    cache.set("key3", "val3", 5000);
    cache.delete("key3");
    expect(cache.get("key3")).toBeUndefined();
  });

  it("does not throw when deleting a non-existent key", () => {
    expect(() => cache.delete("nope")).not.toThrow();
  });

  // ─── clear ───────────────────────────────────────────────────────────────────

  it("clears all entries", () => {
    cache.set("a", "1", 5000);
    cache.set("b", "2", 5000);
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  // ─── size / has ──────────────────────────────────────────────────────────────

  it("reports correct size", () => {
    expect(cache.size()).toBe(0);
    cache.set("x", "1", 5000);
    expect(cache.size()).toBe(1);
    cache.set("y", "2", 5000);
    expect(cache.size()).toBe(2);
  });

  it("has() returns true for valid non-expired key", () => {
    cache.set("hk", "hv", 5000);
    expect(cache.has("hk")).toBe(true);
  });

  it("has() returns false for missing key", () => {
    expect(cache.has("ghost")).toBe(false);
  });

  // ─── Overwrite ───────────────────────────────────────────────────────────────

  it("overwrites an existing key with a new value", () => {
    cache.set("dup", "first", 5000);
    cache.set("dup", "second", 5000);
    expect(cache.get("dup")).toBe("second");
  });

  // ─── Type safety ─────────────────────────────────────────────────────────────

  it("stores and retrieves complex objects", () => {
    const objCache = new Cache<{ value: number; name: string }>();
    const obj = { value: 42, name: "HDFC Bank" };
    objCache.set("complex", obj, 5000);
    expect(objCache.get("complex")).toEqual(obj);
  });
});
