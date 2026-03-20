import * as OTPAuth from "otpauth";

const ISSUER = "NADRO Portal";
const MAX_BYPASS = 3;

export function generateMfaSecret(username: string) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export function verifyMfaToken(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export function canBypassMfa(bypassCount: number): boolean {
  return bypassCount < MAX_BYPASS;
}

export const MFA_MAX_BYPASS = MAX_BYPASS;
