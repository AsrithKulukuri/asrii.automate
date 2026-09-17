import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const DEV_FALLBACK_KEY = "asrii-default-fallback-encryption-key-32chars";

/**
 * Checks whether a production-grade encryption key is configured.
 */
export function isVaultConfigured(): boolean {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.META_APP_SECRET;
  return Boolean(secret && secret.length >= 32);
}

function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.META_APP_SECRET;

  if (process.env.NODE_ENV === "production" && (!secret || secret === DEV_FALLBACK_KEY)) {
    throw new Error(
      "CRITICAL: TOKEN_ENCRYPTION_KEY environment variable is required in production. Must be at least 32 characters."
    );
  }

  const effectiveSecret = secret || DEV_FALLBACK_KEY;
  // Derive a strictly 32-byte key using SHA-256
  return crypto.createHash("sha256").update(effectiveSecret).digest();
}

export interface EncryptedData {
  encryptedAccessToken: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts sensitive string using AES-256-GCM.
 * Never leaks raw plaintext or secrets in error outputs.
 */
export function encryptToken(plainText: string): EncryptedData {
  if (!plainText) {
    throw new Error("Cannot encrypt empty token");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedAccessToken: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts AES-256-GCM encrypted token.
 * Validates authentication tag to ensure data integrity.
 */
export function decryptToken(encrypted: string, ivHex: string, authTagHex: string): string {
  if (!encrypted || !ivHex || !authTagHex) {
    throw new Error("Missing encryption parameters for decryption");
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    throw new Error("Decryption failed: invalid key, ciphertext, or authentication tag tampering detected");
  }
}

/**
 * Safely masks a token for UI display (e.g. EAAB...92kd).
 * Never exposes full token in client responses or logs.
 */
export function maskToken(token: string): string {
  if (!token) return "••••••••";
  if (token.length <= 10) return "••••••••";
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
}
