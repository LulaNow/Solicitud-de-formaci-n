/**
 * Custom Base85 encoding with shuffled alphabet and dynamic rotation.
 * This is a NON-STANDARD encoding that is difficult to decode
 * without knowing the alphabet, rotation seed, and marker format.
 */

const CUSTOM_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";

const ROTATION_SEED = 7;

function rotateAlphabet(alphabet: string, shift: number): string {
  const normalizedShift = ((shift % alphabet.length) + alphabet.length) % alphabet.length;
  return alphabet.slice(normalizedShift) + alphabet.slice(0, normalizedShift);
}

function getRotatedAlphabet(): string {
  const hourBlock = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // 6-hour blocks
  const dynamicShift = (hourBlock * ROTATION_SEED) % CUSTOM_ALPHABET.length;
  return rotateAlphabet(CUSTOM_ALPHABET, dynamicShift);
}

function getAlphabetForTimestamp(timestamp: number): string {
  const hourBlock = Math.floor(timestamp / (1000 * 60 * 60 * 6));
  const dynamicShift = (hourBlock * ROTATION_SEED) % CUSTOM_ALPHABET.length;
  return rotateAlphabet(CUSTOM_ALPHABET, dynamicShift);
}

export function encodeCustom(data: string): string {
  const timestamp = Date.now();
  const alphabet = getRotatedAlphabet();
  const base = alphabet.length;
  const bytes = Buffer.from(data, "utf8");

  let encoded = "";
  let num = BigInt("0x" + bytes.toString("hex"));

  while (num > 0n) {
    const remainder = Number(num % BigInt(base));
    encoded = alphabet[remainder] + encoded;
    num = num / BigInt(base);
  }

  // Prepend timestamp marker (obfuscated)
  const marker = Buffer.from(timestamp.toString(36)).toString("base64url");
  return `${marker}.${encoded}`;
}

export function decodeCustom(encoded: string): string {
  const dotIndex = encoded.indexOf(".");
  if (dotIndex === -1) throw new Error("Invalid encoded data");

  const marker = encoded.slice(0, dotIndex);
  const payload = encoded.slice(dotIndex + 1);

  // Extract timestamp from marker
  const timestamp = parseInt(
    Buffer.from(marker, "base64url").toString("utf8"),
    36
  );
  const alphabet = getAlphabetForTimestamp(timestamp);
  const base = BigInt(alphabet.length);

  let num = 0n;
  for (const char of payload) {
    const index = alphabet.indexOf(char);
    if (index === -1) throw new Error("Invalid character in encoded data");
    num = num * base + BigInt(index);
  }

  const hex = num.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  return Buffer.from(paddedHex, "hex").toString("utf8");
}

export function encodeApiPayload(data: Record<string, unknown>): string {
  return encodeCustom(JSON.stringify(data));
}

export function decodeApiPayload(encoded: string): Record<string, unknown> {
  return JSON.parse(decodeCustom(encoded));
}
