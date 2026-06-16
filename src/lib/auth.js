// Web Crypto API — works in both Edge Runtime and Node.js

export const SESSION_COOKIE  = 'epch_session';
export const SESSION_MAX_AGE = 8 * 60 * 60; // seconds

const enc = new TextEncoder();

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signToken(username) {
  const payload = `${username}:${Date.now()}`;
  const sig     = await hmacHex(process.env.AUTH_SECRET, payload);
  // base64url-encode  payload:sig
  return btoa(`${payload}:${sig}`)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyToken(token) {
  try {
    // base64url-decode
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const lastColon       = decoded.lastIndexOf(':');
    const payload         = decoded.slice(0, lastColon);
    const sig             = decoded.slice(lastColon + 1);
    const secondLastColon = payload.lastIndexOf(':');
    const ts              = payload.slice(secondLastColon + 1);
    const username        = payload.slice(0, secondLastColon);

    const expected = await hmacHex(process.env.AUTH_SECRET, payload);
    if (sig !== expected) return null;
    if (Date.now() - parseInt(ts, 10) > SESSION_MAX_AGE * 1000) return null;

    return { username };
  } catch {
    return null;
  }
}
