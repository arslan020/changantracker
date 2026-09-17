export const COOKIE_NAME = "changan_session";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "heston786";

const SECRET = "heston-changan-tracker-session-v1";
const SESSION_PAYLOAD = "admin:ok";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
};

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmac(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return hex(signature);
}

export async function createSessionToken(): Promise<string> {
  return hmac(SESSION_PAYLOAD);
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken();
  return timingSafeEqual(token, expected);
}

export function credentialsMatch(username: string, password: string): boolean {
  return (
    timingSafeEqual(username.trim().toLowerCase(), ADMIN_USERNAME) &&
    timingSafeEqual(password, ADMIN_PASSWORD)
  );
}
