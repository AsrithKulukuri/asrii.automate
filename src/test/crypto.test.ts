import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken, maskToken } from "../lib/crypto";

describe("Crypto AES-256-GCM Token Encryption", () => {
  it("should encrypt and decrypt a sensitive Meta access token successfully", () => {
    const rawToken = "EAABwzLixnjYBAOd8k249301kdsl2984kdfj02384jsdfk3894";
    const encrypted = encryptToken(rawToken);

    expect(encrypted.encryptedAccessToken).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.encryptedAccessToken).not.toBe(rawToken);

    const decrypted = decryptToken(
      encrypted.encryptedAccessToken,
      encrypted.iv,
      encrypted.authTag
    );
    expect(decrypted).toBe(rawToken);
  });

  it("should fail decryption when authentication tag is tampered with", () => {
    const rawToken = "secret_meta_access_token_12345";
    const encrypted = encryptToken(rawToken);

    // Tamper with authentication tag
    const tamperedTag = "00000000000000000000000000000000";

    expect(() => {
      decryptToken(encrypted.encryptedAccessToken, encrypted.iv, tamperedTag);
    }).toThrow(/Decryption failed/);
  });

  it("should reject encrypting an empty token", () => {
    expect(() => encryptToken("")).toThrow("Cannot encrypt empty token");
  });

  it("should safely mask tokens for UI and logs", () => {
    const fullToken = "EAABwzLixnjYBAOd8k249301kdsl2984kdfj02384jsdfk3894";
    const masked = maskToken(fullToken);

    expect(masked).toBe("EAAB••••••••3894");
    expect(masked).not.toContain("k249301kdsl2984");
  });
});
