import { H3, H3Event } from 'h3/cloudflare';
import { renderProfilePage } from './render';
import { createSession, verifySession, getSessionCookie, parseSessionCookie } from './auth';
import { getConfig, saveConfig } from './config';
import type { PawprintConfig } from './types';

const app = new H3();

function getEnv(event: H3Event): Env {
	const rt = event.runtime as { cloudflare?: { env?: Env } } | undefined;
	return rt?.cloudflare?.env as Env;
}

function isPreview(env: Env): boolean {
	return env.PREVIEW === 'true';
}

const PREVIEW_PASSWORD = 'preview';

async function requireAuth(event: H3Event, next: () => unknown) {
	const path = new URL(event.req.url).pathname;
	if (path === '/api/auth') return next();

	const env = getEnv(event);
	const cookie = parseSessionCookie(event.req.headers.get('cookie'));
	const preview = isPreview(env);
	const secret = preview ? PREVIEW_PASSWORD : env.ADMIN_PASSWORD;

	if (!cookie || !(await verifySession(cookie, secret))) {
		event.res.status = 401;
		return { error: 'Unauthorized' };
	}
	return next();
}

app.use('/api/*', requireAuth);

app.get('/', async (event) => {
	const env = getEnv(event);
	const config = await getConfig(env.CONFIG_KV);

	event.waitUntil(
		env.DB.prepare(
			'INSERT INTO page_visits (referer, country, user_agent) VALUES (?, ?, ?)',
		)
			.bind(
				event.req.headers.get('referer') ?? '',
				(event.req as unknown as { cf?: { country?: string } }).cf?.country ?? '',
				event.req.headers.get('user-agent') ?? '',
			)
			.run(),
	);

	return new Response(renderProfilePage(config), {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
});

app.get('/click/:index', async (event) => {
	const env = getEnv(event);
	const config = await getConfig(env.CONFIG_KV);
	const indexStr = event.context.params?.index;

	if (indexStr === undefined) {
		event.res.status = 400;
		return { error: 'Missing link index' };
	}

	const index = parseInt(indexStr, 10);
	if (isNaN(index) || index < 0 || index >= config.links.length) {
		event.res.status = 404;
		return { error: 'Link not found' };
	}

	const link = config.links[index];

	if (!isPreview(env)) {
		event.waitUntil(
			env.DB.prepare(
				'INSERT INTO clicks (link_index, link_title, destination_url, referer, country, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
			)
				.bind(
					index,
					link.title,
					link.url,
					event.req.headers.get('referer') ?? '',
					(event.req as unknown as { cf?: { country?: string } }).cf?.country ?? '',
					event.req.headers.get('user-agent') ?? '',
				)
				.run(),
		);
	}

	return new Response(null, {
		status: 302,
		headers: { Location: link.url },
	});
});

app.post('/api/auth', async (event) => {
	const env = getEnv(event);
	const body = (await event.req.json()) as { password?: string };
	const preview = isPreview(env);
	const validPassword = preview
		? body.password === PREVIEW_PASSWORD || body.password === env.ADMIN_PASSWORD
		: body.password === env.ADMIN_PASSWORD;

	if (!body.password || !validPassword) {
		event.res.status = 401;
		return { error: 'Invalid password' };
	}

	const secret = preview ? PREVIEW_PASSWORD : env.ADMIN_PASSWORD;
	const token = await createSession(secret);
	return new Response(JSON.stringify({ ok: true }), {
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': getSessionCookie(token),
		},
	});
});

app.get('/api/analytics', async (event) => {
	const env = getEnv(event);
	const config = await getConfig(env.CONFIG_KV);

	if (isPreview(env)) {
		return getMockAnalytics(config);
	}

	const url = new URL(event.req.url);
	const days = parseInt(url.searchParams.get('days') ?? '30', 10);
	const since = new Date(Date.now() - days * 86400000).toISOString();

	const [totals, timeline, referrers, countries, pageVisits] = await Promise.all([
		env.DB.prepare(
			'SELECT link_index, link_title, destination_url, COUNT(*) as clicks FROM clicks WHERE clicked_at >= ? GROUP BY link_index ORDER BY clicks DESC',
		)
			.bind(since)
			.all(),
		env.DB.prepare(
			'SELECT DATE(clicked_at) as day, COUNT(*) as clicks FROM clicks WHERE clicked_at >= ? GROUP BY day ORDER BY day',
		)
			.bind(since)
			.all(),
		env.DB.prepare(
			"SELECT referer, COUNT(*) as clicks FROM clicks WHERE clicked_at >= ? AND referer != '' GROUP BY referer ORDER BY clicks DESC LIMIT 10",
		)
			.bind(since)
			.all(),
		env.DB.prepare(
			"SELECT country, COUNT(*) as clicks FROM clicks WHERE clicked_at >= ? AND country != '' GROUP BY country ORDER BY clicks DESC LIMIT 10",
		)
			.bind(since)
			.all(),
		env.DB.prepare('SELECT COUNT(*) as visits FROM page_visits WHERE visited_at >= ?')
			.bind(since)
			.first(),
	]);

	return {
		totals: totals.results,
		timeline: timeline.results,
		topReferrers: referrers.results,
		topCountries: countries.results,
		pageVisits: (pageVisits as Record<string, number> | null)?.visits ?? 0,
		links: config.links,
	};
});

app.get('/api/config', async (event) => {
	const env = getEnv(event);
	const config = await getConfig(env.CONFIG_KV);
	return config;
});

app.post('/api/config', async (event) => {
	const env = getEnv(event);
	const body = (await event.req.json()) as PawprintConfig;
	if (!isPreview(env)) {
		await saveConfig(env.CONFIG_KV, body);
	}
	return { ok: true };
});

app.post('/api/preview', async (event) => {
	const config = (await event.req.json()) as PawprintConfig;
	return new Response(renderProfilePage(config), {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
});

app.get('/api/analytics/:index', async (event) => {
	const env = getEnv(event);
	const config = await getConfig(env.CONFIG_KV);
	const indexStr = event.context.params?.index;

	if (indexStr === undefined) {
		event.res.status = 400;
		return { error: 'Missing link index' };
	}

	const index = parseInt(indexStr, 10);
	if (isNaN(index) || index < 0 || index >= config.links.length) {
		event.res.status = 404;
		return { error: 'Link not found' };
	}

	if (isPreview(env)) {
		return getMockLinkAnalytics(config, index);
	}

	const url = new URL(event.req.url);
	const days = parseInt(url.searchParams.get('days') ?? '30', 10);
	const since = new Date(Date.now() - days * 86400000).toISOString();

	const [total, timeline, referrers, countries] = await Promise.all([
		env.DB.prepare('SELECT COUNT(*) as clicks FROM clicks WHERE link_index = ? AND clicked_at >= ?')
			.bind(index, since)
			.first(),
		env.DB.prepare(
			'SELECT DATE(clicked_at) as day, COUNT(*) as clicks FROM clicks WHERE link_index = ? AND clicked_at >= ? GROUP BY day ORDER BY day',
		)
			.bind(index, since)
			.all(),
		env.DB.prepare(
			'SELECT referer, COUNT(*) as clicks FROM clicks WHERE link_index = ? AND clicked_at >= ? AND referer != \'\' GROUP BY referer ORDER BY clicks DESC LIMIT 10',
		)
			.bind(index, since)
			.all(),
		env.DB.prepare(
			'SELECT country, COUNT(*) as clicks FROM clicks WHERE link_index = ? AND clicked_at >= ? AND country != \'\' GROUP BY country ORDER BY clicks DESC LIMIT 10',
		)
			.bind(index, since)
			.all(),
	]);

	return {
		link: config.links[index],
		totalClicks: (total as Record<string, number> | null)?.clicks ?? 0,
		timeline: timeline.results,
		topReferrers: referrers.results,
		topCountries: countries.results,
	};
});

function generateMockTimeline(days: number) {
	const timeline = [];
	for (let i = days; i >= 0; i--) {
		const date = new Date(Date.now() - i * 86400000);
		timeline.push({
			day: date.toISOString().split('T')[0],
			clicks: Math.floor(Math.random() * 80) + 10,
		});
	}
	return timeline;
}

function getMockAnalytics(config: PawprintConfig) {
	return {
		totals: config.links.map((link, i) => ({
			link_index: i,
			link_title: link.title,
			destination_url: link.url,
			clicks: Math.floor(Math.random() * 200) + 20,
		})),
		timeline: generateMockTimeline(30),
		links: config.links,
	};
}

function getMockLinkAnalytics(config: PawprintConfig, index: number) {
	return {
		link: config.links[index],
		totalClicks: Math.floor(Math.random() * 300) + 50,
		timeline: generateMockTimeline(30),
		topReferrers: [
			{ referer: 'https://twitter.com', clicks: 45 },
			{ referer: 'https://google.com', clicks: 32 },
			{ referer: 'https://discord.com', clicks: 28 },
			{ referer: 'https://reddit.com', clicks: 15 },
			{ referer: 'https://telegram.org', clicks: 8 },
		],
		topCountries: [
			{ country: 'US', clicks: 120 },
			{ country: 'GB', clicks: 35 },
			{ country: 'CA', clicks: 28 },
			{ country: 'DE', clicks: 18 },
			{ country: 'AU', clicks: 12 },
		],
	};
}

export default {
	fetch: (request: Request, env: Record<string, unknown>, ctx: ExecutionContext) => {
		Object.defineProperties(request, {
			waitUntil: { value: ctx.waitUntil.bind(ctx) },
			runtime: {
				enumerable: true,
				value: {
					name: 'cloudflare',
					cloudflare: { env, context: ctx },
				},
			},
		});
		return app.fetch(request as Parameters<typeof app.fetch>[0]);
	},
};
