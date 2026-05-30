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

async function requireAuth(event: H3Event, next: () => unknown) {
	const path = new URL(event.req.url).pathname;
	if (path === '/api/auth') return next();

	const env = getEnv(event);
	const cookie = parseSessionCookie(event.req.headers.get('cookie'));

	if (!cookie || !(await verifySession(cookie, env.ADMIN_PASSWORD))) {
		event.res.status = 401;
		return { error: 'Unauthorized' };
	}
	return next();
}

app.use('/api/*', requireAuth);

app.get('/', async (event) => {
	const env = getEnv(event);
	const config = await getConfig(env.CONFIG_KV);
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

	return new Response(null, {
		status: 302,
		headers: { Location: link.url },
	});
});

app.post('/api/auth', async (event) => {
	const env = getEnv(event);
	const body = (await event.req.json()) as { password?: string };

	if (!body.password || body.password !== env.ADMIN_PASSWORD) {
		event.res.status = 401;
		return { error: 'Invalid password' };
	}

	const token = await createSession(env.ADMIN_PASSWORD);
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
	const url = new URL(event.req.url);
	const days = parseInt(url.searchParams.get('days') ?? '30', 10);
	const since = new Date(Date.now() - days * 86400000).toISOString();

	const [totals, timeline] = await Promise.all([
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
	]);

	return {
		totals: totals.results,
		timeline: timeline.results,
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
	await saveConfig(env.CONFIG_KV, body);
	return { ok: true };
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
