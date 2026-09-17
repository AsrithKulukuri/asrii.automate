import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../lib/rate-limit";

describe("Production Sliding Window Rate Limiter", () => {
  it("should allow requests under the configured threshold", () => {
    const key = `test_client_${Date.now()}`;
    const res1 = checkRateLimit(key, { limit: 5, windowMs: 10000 });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = checkRateLimit(key, { limit: 5, windowMs: 10000 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("should block requests when exceeding the limit", () => {
    const key = `test_blocked_${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { limit: 3, windowMs: 10000 });
    }

    const blocked = checkRateLimit(key, { limit: 3, windowMs: 10000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.reset).toBeGreaterThan(0);
  });
});
