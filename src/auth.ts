const COOKIE_NAME = 'pawprint_session';
const SESSION_TTL = 60 * 60 * 24; // 24 hours

async function hmacSign(key: string, data: string): Promise<string> {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(key),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
	return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function hmacVerify(key: string, data: string, signature: string): Promise<boolean> {
	const expected = await hmacSign(key, data);
	return expected === signature;
}

export async function createSession(password: string): Promise<string> {
	const expires = Math.floor(Date.now() / 1000) + SESSION_TTL;
	const payload = `pawprint:${expires}`;
	const sig = await hmacSign(password, payload);
	return `${payload}.${sig}`;
}

export async function verifySession(token: string, password: string): Promise<boolean> {
	const lastDot = token.lastIndexOf('.');
	if (lastDot === -1) return false;

	const payload = token.substring(0, lastDot);
	const sig = token.substring(lastDot + 1);

	if (!(await hmacVerify(password, payload, sig))) return false;

	const parts = payload.split(':');
	if (parts.length !== 2) return false;

	const expires = parseInt(parts[1], 10);
	if (isNaN(expires) || expires < Math.floor(Date.now() / 1000)) return false;

	return true;
}

export function getSessionCookie(token: string): string {
	return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`;
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
	return match ? match[1] : null;
}
