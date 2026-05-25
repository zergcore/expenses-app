import crypto from "crypto";

const SECURE_TOKEN_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret-for-signing-tokens";

/**
 * Generates an HMAC-SHA256 signed token that bundles a userId and a timestamp.
 * Base64URL encoded for web safety.
 */
export function generateSecureToken(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", SECURE_TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Decodes and verifies the token.
 * Returns the userId if valid and not expired (24h validity window). Otherwise returns null.
 */
export function verifySecureToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, timestampStr, hmac] = decoded.split(":");
    if (!userId || !timestampStr || !hmac) return null;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Check if token has expired or is in the future
    if (now - timestamp > twentyFourHours || timestamp > now) {
      return null;
    }

    const payload = `${userId}:${timestampStr}`;
    const expectedHmac = crypto
      .createHmac("sha256", SECURE_TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expectedHmac, "hex"),
    );

    return isValid ? userId : null;
  } catch (e) {
    console.error(String(e));
    return null;
  }
}
