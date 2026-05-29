import type { PawprintConfig } from './types';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function escapeAttr(str: string): string {
	return escapeHtml(str);
}

function loginPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Pawprint Admin</title>
	<style>
		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
		body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
		.login-card { background: #1e293b; padding: 2rem; border-radius: 12px; width: 100%; max-width: 400px; }
		h1 { font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center; }
		input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; font-size: 1rem; margin-bottom: 1rem; }
		button { width: 100%; padding: 10px 14px; border-radius: 8px; border: none; background: #6366f1; color: #fff; font-size: 1rem; cursor: pointer; font-weight: 500; }
		button:hover { background: #4f46e5; }
		.error { color: #f87171; font-size: 0.875rem; margin-bottom: 1rem; display: none; }
	</style>
</head>
<body>
	<div class="login-card">
		<h1>Pawprint Admin</h1>
		<div id="error" class="error"></div>
		<input type="password" id="password" placeholder="Enter admin password" autofocus />
		<button onclick="login()">Log In</button>
	</div>
	<script>
		async function login() {
			const pw = document.getElementById('password').value;
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: pw })
			});
			if (res.ok) {
				location.reload();
			} else {
				const el = document.getElementById('error');
				el.textContent = 'Invalid password';
				el.style.display = 'block';
			}
		}
		document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
	</script>
</body>
</html>`;
}

export function renderAdminPage(config: PawprintConfig | null): string {
	if (!config) return loginPage();

	const configJson = JSON.stringify(config, null, 2);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Pawprint Admin</title>
	<style>
		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
		body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 2rem 1rem; }
		.container { max-width: 720px; margin: 0 auto; }
		h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
		.subtitle { color: #94a3b8; margin-bottom: 2rem; font-size: 0.9rem; }
		.nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
		.nav a { color: #818cf8; text-decoration: none; font-size: 0.9rem; }
		.nav a:hover { text-decoration: underline; }

		.section { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
		.section h2 { font-size: 1.15rem; margin-bottom: 1rem; color: #f8fafc; }

		label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.25rem; margin-top: 0.75rem; }
		label:first-child { margin-top: 0; }
		input[type="text"], input[type="url"], input[type="color"], select {
			width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #334155;
			background: #0f172a; color: #e2e8f0; font-size: 0.9rem;
		}
		input[type="color"] { height: 40px; padding: 4px; cursor: pointer; }
		select { cursor: pointer; }

		.link-group, .social-group { background: #162032; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; position: relative; }
		.remove-btn { position: absolute; top: 0.75rem; right: 0.75rem; background: #dc2626; color: #fff; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 0.75rem; }
		.remove-btn:hover { background: #b91c1c; }
		.add-btn { background: #334155; color: #e2e8f0; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-size: 0.85rem; margin-top: 0.5rem; }
		.add-btn:hover { background: #475569; }

		.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

		.actions { display: flex; gap: 1rem; margin-top: 1rem; }
		.save-btn { background: #22c55e; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; cursor: pointer; font-weight: 600; }
		.save-btn:hover { background: #16a34a; }
		.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
		.reset-btn { background: #475569; color: #e2e8f0; border: none; border-radius: 8px; padding: 12px 24px; font-size: 1rem; cursor: pointer; }
		.reset-btn:hover { background: #64748b; }

		.toast { position: fixed; bottom: 2rem; right: 2rem; background: #22c55e; color: #fff; padding: 12px 20px; border-radius: 8px; font-weight: 500; display: none; z-index: 100; }
		.toast.error { background: #dc2626; }
	</style>
</head>
<body>
	<div class="container">
		<div class="nav">
			<a href="/">View Page</a>
			<a href="/analytics">Analytics</a>
		</div>
		<h1>Pawprint Admin</h1>
		<p class="subtitle">Edit your profile configuration. Changes are saved instantly.</p>

		<form id="admin-form" onsubmit="return false;">
			<!-- Profile -->
			<div class="section">
				<h2>Profile</h2>
				<label for="cfg-name">Name</label>
				<input type="text" id="cfg-name" value="${escapeAttr(config.name)}" />

				<label for="cfg-bio">Bio</label>
				<input type="text" id="cfg-bio" value="${escapeAttr(config.bio)}" />

				<label for="cfg-avatar">Avatar URL</label>
				<input type="url" id="cfg-avatar" value="${escapeAttr(config.avatar)}" />

				<label for="cfg-header">Header Image URL (optional)</label>
				<input type="url" id="cfg-header" value="${escapeAttr(config.header ?? '')}" />
			</div>

			<!-- Links -->
			<div class="section">
				<h2>Links</h2>
				<div id="links-container">
					${config.links.map((link, i) => `<div class="link-group" data-index="${i}">
						<button type="button" class="remove-btn" onclick="removeLink(this)">Remove</button>
						<label>Title</label>
						<input type="text" class="link-title" value="${escapeAttr(link.title)}" />
						<div class="row">
							<div>
								<label>URL</label>
								<input type="url" class="link-url" value="${escapeAttr(link.url)}" />
							</div>
							<div>
								<label>Icon (optional)</label>
								<input type="text" class="link-icon" value="${escapeAttr(link.icon ?? '')}" placeholder="globe, heart, star..." />
							</div>
						</div>
					</div>`).join('\n\t\t\t\t\t')}
				</div>
				<button type="button" class="add-btn" onclick="addLink()">+ Add Link</button>
			</div>

			<!-- Socials -->
			<div class="section">
				<h2>Social Media</h2>
				<div id="socials-container">
					${config.socials.map((social, i) => `<div class="social-group" data-index="${i}">
						<button type="button" class="remove-btn" onclick="removeSocial(this)">Remove</button>
						<div class="row">
							<div>
								<label>Platform</label>
								<select class="social-platform">
									${['twitter', 'github', 'instagram', 'youtube', 'discord', 'twitch', 'mastodon', 'bluesky', 'telegram', 'linkedin', 'tiktok', 'email'].map(p => `<option value="${p}"${social.platform === p ? ' selected' : ''}>${p}</option>`).join('')}
								</select>
							</div>
							<div>
								<label>URL</label>
								<input type="url" class="social-url" value="${escapeAttr(social.url)}" />
							</div>
						</div>
					</div>`).join('\n\t\t\t\t\t')}
				</div>
				<button type="button" class="add-btn" onclick="addSocial()">+ Add Social</button>
			</div>

			<!-- Theme -->
			<div class="section">
				<h2>Theme</h2>
				<div class="row">
					<div>
						<label for="cfg-gradient">Gradient Preset</label>
						<select id="cfg-gradient">
							<option value="">None (use color below)</option>
							${['sunset', 'ocean', 'forest', 'midnight', 'aurora', 'ember', 'lavender', 'cosmic', 'slate', 'candy'].map(g => `<option value="${g}"${config.theme.gradient === g ? ' selected' : ''}>${g}</option>`).join('')}
						</select>
					</div>
					<div>
						<label for="cfg-color">Custom Color</label>
						<input type="text" id="cfg-color" value="${escapeAttr(config.theme.color ?? '')}" placeholder="#1a1a2e" />
					</div>
				</div>

				<label for="cfg-bgimage">Background Image URL (optional)</label>
				<input type="url" id="cfg-bgimage" value="${escapeAttr(config.theme.backgroundImage ?? '')}" />

				<div class="row">
					<div>
						<label for="cfg-textcolor">Text Color</label>
						<input type="color" id="cfg-textcolor" value="${escapeAttr(config.theme.textColor ?? '#ffffff')}" />
					</div>
					<div>
						<label for="cfg-font">Font (Google Fonts)</label>
						<input type="text" id="cfg-font" value="${escapeAttr(config.theme.font ?? 'Inter')}" placeholder="Inter" />
					</div>
				</div>

				<div class="row">
					<div>
						<label for="cfg-buttonstyle">Button Style</label>
						<select id="cfg-buttonstyle">
							${['filled', 'outlined', 'soft'].map(s => `<option value="${s}"${config.theme.buttonStyle === s ? ' selected' : ''}>${s}</option>`).join('')}
						</select>
					</div>
					<div>
						<label for="cfg-buttonradius">Button Radius</label>
						<input type="text" id="cfg-buttonradius" value="${escapeAttr(config.theme.buttonRadius ?? '12px')}" />
					</div>
				</div>

				<div class="row">
					<div>
						<label for="cfg-buttoncolor">Button Color</label>
						<input type="color" id="cfg-buttoncolor" value="${escapeAttr(config.theme.buttonColor ?? '#6c63ff')}" />
					</div>
					<div>
						<label for="cfg-buttontextcolor">Button Text Color</label>
						<input type="color" id="cfg-buttontextcolor" value="${escapeAttr(config.theme.buttonTextColor ?? '#ffffff')}" />
					</div>
				</div>
			</div>

			<div class="actions">
				<button type="button" class="save-btn" id="save-btn" onclick="saveConfig()">Save Changes</button>
				<button type="button" class="reset-btn" onclick="resetConfig()">Reset</button>
			</div>
		</form>
	</div>

	<div id="toast" class="toast"></div>

	<script>
		const originalConfig = ${configJson};

		function collectConfig() {
			const links = [];
			document.querySelectorAll('.link-group').forEach(g => {
				const title = g.querySelector('.link-title').value.trim();
				const url = g.querySelector('.link-url').value.trim();
				const icon = g.querySelector('.link-icon').value.trim();
				if (title && url) {
					const link = { title, url };
					if (icon) link.icon = icon;
					links.push(link);
				}
			});

			const socials = [];
			document.querySelectorAll('.social-group').forEach(g => {
				const platform = g.querySelector('.social-platform').value;
				const url = g.querySelector('.social-url').value.trim();
				if (platform && url) socials.push({ platform, url });
			});

			const gradient = document.getElementById('cfg-gradient').value || undefined;
			const color = document.getElementById('cfg-color').value.trim() || undefined;
			const backgroundImage = document.getElementById('cfg-bgimage').value.trim() || undefined;

			return {
				name: document.getElementById('cfg-name').value.trim(),
				bio: document.getElementById('cfg-bio').value.trim(),
				avatar: document.getElementById('cfg-avatar').value.trim(),
				header: document.getElementById('cfg-header').value.trim() || undefined,
				links,
				socials,
				theme: {
					gradient,
					color,
					backgroundImage,
					textColor: document.getElementById('cfg-textcolor').value,
					font: document.getElementById('cfg-font').value.trim() || 'Inter',
					buttonStyle: document.getElementById('cfg-buttonstyle').value,
					buttonColor: document.getElementById('cfg-buttoncolor').value,
					buttonTextColor: document.getElementById('cfg-buttontextcolor').value,
					buttonRadius: document.getElementById('cfg-buttonradius').value.trim() || '12px',
				}
			};
		}

		async function saveConfig() {
			const btn = document.getElementById('save-btn');
			btn.disabled = true;
			btn.textContent = 'Saving...';
			try {
				const config = collectConfig();
				const res = await fetch('/api/config', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(config)
				});
				if (!res.ok) throw new Error('Save failed');
				showToast('Config saved!');
			} catch (err) {
				showToast(err.message, true);
			} finally {
				btn.disabled = false;
				btn.textContent = 'Save Changes';
			}
		}

		function resetConfig() {
			if (!confirm('Reset to saved config? Unsaved changes will be lost.')) return;
			location.reload();
		}

		function showToast(msg, isError) {
			const el = document.getElementById('toast');
			el.textContent = msg;
			el.className = 'toast' + (isError ? ' error' : '');
			el.style.display = 'block';
			setTimeout(() => { el.style.display = 'none'; }, 3000);
		}

		function addLink() {
			const container = document.getElementById('links-container');
			const div = document.createElement('div');
			div.className = 'link-group';
			div.innerHTML = \`
				<button type="button" class="remove-btn" onclick="removeLink(this)">Remove</button>
				<label>Title</label>
				<input type="text" class="link-title" value="" />
				<div class="row">
					<div>
						<label>URL</label>
						<input type="url" class="link-url" value="" />
					</div>
					<div>
						<label>Icon (optional)</label>
						<input type="text" class="link-icon" value="" placeholder="globe, heart, star..." />
					</div>
				</div>\`;
			container.appendChild(div);
		}

		function removeLink(btn) {
			btn.closest('.link-group').remove();
		}

		function addSocial() {
			const container = document.getElementById('socials-container');
			const div = document.createElement('div');
			div.className = 'social-group';
			div.innerHTML = \`
				<button type="button" class="remove-btn" onclick="removeSocial(this)">Remove</button>
				<div class="row">
					<div>
						<label>Platform</label>
						<select class="social-platform">
							${['twitter', 'github', 'instagram', 'youtube', 'discord', 'twitch', 'mastodon', 'bluesky', 'telegram', 'linkedin', 'tiktok', 'email'].map(p => `<option value="${p}">${p}</option>`).join('')}
						</select>
					</div>
					<div>
						<label>URL</label>
						<input type="url" class="social-url" value="" />
					</div>
				</div>\`;
			container.appendChild(div);
		}

		function removeSocial(btn) {
			btn.closest('.social-group').remove();
		}
	</script>
</body>
</html>`;
}
