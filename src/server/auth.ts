/**
 * Autenticación administrativa con Web Crypto HMAC-SHA256
 * Funciona nativamente en Cloudflare Workers y en Node.js
 */

export async function createSessionToken(secret: string, username: string = 'admin'): Promise<string> {
  const enc = new TextEncoder();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 horas
  const payload = JSON.stringify({ u: username, exp: expiresAt });
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'apf-admin-fallback-dev-secret-32chars'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const b64Payload = btoa(payload);
  return `${b64Payload}.${sigHex}`;
}

export async function verifySessionToken(token: string | null | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  try {
    const [b64Payload, sigHex] = token.split('.');
    if (!b64Payload || !sigHex) return false;

    const payload = atob(b64Payload);
    const data = JSON.parse(payload);
    if (!data.exp || data.exp < Date.now()) {
      return false;
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret || 'apf-admin-fallback-dev-secret-32chars'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
    return valid;
  } catch {
    return false;
  }
}
