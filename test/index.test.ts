import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';

async function getAuthCookie(): Promise<string> {
	const res = await SELF.fetch('https://localhost/api/auth', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password: env.ANALYTICS_PASSWORD }),
	});
	const cookie = res.headers.get('set-cookie');
	if (!cookie) return '';
	return cookie.split(';')[0];
}

async function setupDb() {
	await env.DB.exec(
		"CREATE TABLE IF NOT EXISTS clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, link_index INTEGER NOT NULL, link_title TEXT NOT NULL, destination_url TEXT NOT NULL, referer TEXT DEFAULT '', country TEXT DEFAULT '', user_agent TEXT DEFAULT '', clicked_at TEXT NOT NULL DEFAULT (datetime('now')))",
	);
}

describe('Profile page', () => {
	it('renders the profile page at /', async () => {
		const res = await SELF.fetch('https://localhost/');
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('Your Name');
		expect(html).toContain('A short bio about yourself.');
		expect(html).toContain('/click/0');
	});
});

describe('Click tracking', () => {
	beforeAll(setupDb);

	it('redirects to the correct URL', async () => {
		const res = await SELF.fetch('https://localhost/click/0', { redirect: 'manual' });
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://example.com');
	});

	it('returns 404 for invalid link index', async () => {
		const res = await SELF.fetch('https://localhost/click/999');
		expect(res.status).toBe(404);
	});
});

describe('Auth', () => {
	beforeAll(setupDb);

	it('rejects invalid password', async () => {
		const res = await SELF.fetch('https://localhost/api/auth', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'wrong' }),
		});
		expect(res.status).toBe(401);
	});

	it('accepts valid password and sets cookie', async () => {
		const res = await SELF.fetch('https://localhost/api/auth', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: env.ANALYTICS_PASSWORD }),
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('set-cookie')).toContain('pawprint_session=');
	});

	it('rejects unauthenticated API requests', async () => {
		const res = await SELF.fetch('https://localhost/api/analytics');
		expect(res.status).toBe(401);
	});

	it('allows authenticated API requests', async () => {
		const cookie = await getAuthCookie();
		const res = await SELF.fetch('https://localhost/api/analytics', {
			headers: { Cookie: cookie },
		});
		expect(res.status).toBe(200);
	});
});

describe('Admin', () => {
	it('shows login page when unauthenticated', async () => {
		const res = await SELF.fetch('https://localhost/admin');
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('Pawprint Admin');
		expect(html).toContain('password');
		expect(html).not.toContain('cfg-name');
	});

	it('shows admin form when authenticated', async () => {
		const cookie = await getAuthCookie();
		const res = await SELF.fetch('https://localhost/admin', {
			headers: { Cookie: cookie },
		});
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain('cfg-name');
		expect(html).toContain('Save Changes');
	});

	it('rejects unauthenticated config API requests', async () => {
		const res = await SELF.fetch('https://localhost/api/config');
		expect(res.status).toBe(401);
	});

	it('returns config via GET /api/config', async () => {
		const cookie = await getAuthCookie();
		const res = await SELF.fetch('https://localhost/api/config', {
			headers: { Cookie: cookie },
		});
		expect(res.status).toBe(200);
		const data = (await res.json()) as { name: string; links: unknown[] };
		expect(data.name).toBe('Your Name');
		expect(data.links).toHaveLength(3);
	});

	it('saves and loads config via KV', async () => {
		const cookie = await getAuthCookie();
		const newConfig = {
			name: 'Updated Name',
			bio: 'Updated bio',
			avatar: 'https://example.com/new-avatar.jpg',
			links: [{ title: 'New Link', url: 'https://new.example.com' }],
			socials: [{ platform: 'github', url: 'https://github.com/test' }],
			theme: { gradient: 'ocean', buttonStyle: 'outlined' },
		};

		const saveRes = await SELF.fetch('https://localhost/api/config', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify(newConfig),
		});
		expect(saveRes.status).toBe(200);

		const getRes = await SELF.fetch('https://localhost/api/config', {
			headers: { Cookie: cookie },
		});
		const data = (await getRes.json()) as { name: string; links: { title: string }[] };
		expect(data.name).toBe('Updated Name');
		expect(data.links).toHaveLength(1);
		expect(data.links[0].title).toBe('New Link');
	});

	it('serves updated config on profile page after KV save', async () => {
		const cookie = await getAuthCookie();
		const newConfig = {
			name: 'KV Test Name',
			bio: 'KV bio',
			avatar: 'https://example.com/kv.jpg',
			links: [{ title: 'KV Link', url: 'https://kv.example.com' }],
			socials: [],
			theme: { gradient: 'sunset' },
		};

		await SELF.fetch('https://localhost/api/config', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify(newConfig),
		});

		const res = await SELF.fetch('https://localhost/');
		const html = await res.text();
		expect(html).toContain('KV Test Name');
		expect(html).toContain('KV bio');
	});
});

describe('Analytics API', () => {
	beforeAll(setupDb);

	it('returns analytics summary', async () => {
		const cookie = await getAuthCookie();
		const res = await SELF.fetch('https://localhost/api/analytics', {
			headers: { Cookie: cookie },
		});
		expect(res.status).toBe(200);
		const data = (await res.json()) as { totals: unknown[]; timeline: unknown[]; links: unknown[] };
		expect(data).toHaveProperty('totals');
		expect(data).toHaveProperty('timeline');
		expect(data).toHaveProperty('links');
	});

	it('returns per-link analytics', async () => {
		const cookie = await getAuthCookie();
		const res = await SELF.fetch('https://localhost/api/analytics/0', {
			headers: { Cookie: cookie },
		});
		expect(res.status).toBe(200);
		const data = (await res.json()) as { link: unknown; totalClicks: number; timeline: unknown[] };
		expect(data).toHaveProperty('link');
		expect(data).toHaveProperty('totalClicks');
		expect(data).toHaveProperty('timeline');
	});
});
