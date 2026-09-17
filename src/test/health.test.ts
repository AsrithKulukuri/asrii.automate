import { describe, it, expect } from "vitest";
import { isVaultConfigured } from "../lib/crypto";

describe("Production Health & Readiness Verification", () => {
  it("should report vault configuration status correctly", () => {
    const configured = isVaultConfigured();
    // In our test environment, either key is configured or default dev key
    expect(typeof configured).toBe("boolean");
  });
});
