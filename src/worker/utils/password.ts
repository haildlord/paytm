// Password hashing with PBKDF2-SHA256 from Web Crypto.
//
// Why not bcrypt like main? `bcrypt` is a native Node addon and can't load on Workers,
// and the pure-JS `bcryptjs` takes ~70 ms of CPU per hash, far above the Workers free
// plan's 10 ms per request. PBKDF2 is built into the runtime and runs as native code.
//
// Stored format: pbkdf2_sha256$<iterations>$<salt base64>$<hash base64>

const ITERATIONS = 100_000; // the maximum PBKDF2 iteration count Workers allows
const SALT_BYTES = 16;
const HASH_BITS = 256;

const encoder = new TextEncoder();

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, HASH_BITS);
  return new Uint8Array(bits);
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;

  const expected = fromBase64(hash);
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  // Constant-time comparison, so response timing doesn't leak how many bytes matched.
  return actual.byteLength === expected.byteLength && crypto.subtle.timingSafeEqual(actual, expected);
}

// Checked against when the email doesn't exist, so "no such user" takes as long as
// "wrong password" and response times don't reveal which emails are registered.
export const DUMMY_HASH = `pbkdf2_sha256$${ITERATIONS}$${"A".repeat(22)}==$${"A".repeat(43)}=`;
