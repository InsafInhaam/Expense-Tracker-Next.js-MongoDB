import crypto from "crypto";

// Use a strong encryption key from environment
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-32-char-key-change-this!!"; // Must be 32 characters
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypts sensitive data like OAuth tokens
 */
export function encrypt(text: string): string {
  if (!text) return "";

  // Ensure key is exactly 32 bytes
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts encrypted data
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const parts = encryptedText.split(":");

    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
