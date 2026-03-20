import crypto from "crypto";

const ALGORITHM = "sha256";

function getHmacSecret(): string {
  const secret = process.env.HMAC_SECRET;
  if (!secret) throw new Error("HMAC_SECRET must be set in .env");
  return secret;
}

export function signPayload(payload: string): string {
  const hmac = crypto.createHmac(ALGORITHM, getHmacSecret());
  hmac.update(payload);
  return hmac.digest("hex");
}

export function verifySignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

export function createSignedResponse<T>(data: T): {
  data: T;
  signature: string;
  timestamp: number;
} {
  const timestamp = Date.now();
  const payload = JSON.stringify({ data, timestamp });
  const signature = signPayload(payload);
  return { data, signature, timestamp };
}
