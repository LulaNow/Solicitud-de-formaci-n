import "server-only";
import argon2 from "argon2";

const PEPPER = process.env.ENCRYPTION_PEPPER || "";

export async function hashPassword(password: string): Promise<string> {
  const pepperedPassword = password + PEPPER;
  return argon2.hash(pepperedPassword, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const pepperedPassword = password + PEPPER;
  try {
    return await argon2.verify(hash, pepperedPassword);
  } catch {
    return false;
  }
}
