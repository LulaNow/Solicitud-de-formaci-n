import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string in .env");
  }

  // Trim whitespace and validate hex format
  const cleanKey = key.trim();
  
  // Validate it's a valid hex string of exactly 64 characters
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string in .env");
  }

  const buffer = Buffer.from(cleanKey, "hex");
  
  // AES-256 requires a 32-byte key
  if (buffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string in .env");
  }

  return buffer;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptJson(data: Record<string, unknown>): string {
  return encrypt(JSON.stringify(data));
}

export function decryptJson(encryptedData: string): Record<string, unknown> {
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted);
}
