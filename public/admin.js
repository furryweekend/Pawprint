var PLATFORMS = ['twitter', 'github', 'instagram', 'youtube', 'discord', 'twitch', 'mastodon', 'bluesky', 'telegram', 'linkedin', 'tiktok', 'email'];

var previewDebounce = null;

/* ── Utilities ── */

function esc(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function $(id) { return document.getElementById(id); }

function showToast(msg, isError) {
	var el = $('toast');
	el.textContent = msg;
	el.className = 'toast' + (isError ? ' error' : '');
	el.style.display = 'block';
	setTimeout(function() { el.style.display = 'none'; }, 3000);
}

/* ── Auth ── */

async function login() {
	var pw = $('password').value;
	var errorEl = $('login-error');
	errorEl.style.display = 'none';

	try {
		var res = await fetch('/api/auth', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: pw }),
		});
		if (!res.ok) {
			errorEl.textContent = 'Invalid password';
			errorEl.style.display = 'block';
			return;
		}
		loadAdmin();
	} catch (e) {
		errorEl.textContent = 'Connection error';
		errorEl.style.display = 'block';
	}
}

async function loadAdmin() {
	try {
		var res = await fetch('/api/config');
		if (!res.ok) return;

		var config = await res.json();
		$('login-section').style.display = 'none';
		$('admin-panel').classList.add('active');
		populateForm(config);
		schedulePreviewUpdate();
	} catch (e) { /* stay on login */ }
}

/* ── Form: dynamic elements ── */

function createLinkHtml(link, index) {
	return '<div class="link-group" data-index="' + index + '">'
		+ '<button type="button" class="remove-btn" onclick="removeLink(this)">Remove</button>'
		+ '<label>Title</label>'
		+ '<input type="text" class="link-title" value="' + esc(link.title) + '" />'
		+ '<div class="row"><div>'
		+ '<label>URL</label>'
		+ '<input type="url" class="link-url" value="' + esc(link.url) + '" />'
		+ '</div><div>'
		+ '<label>Icon (optional)</label>'
		+ '<input type="text" class="link-icon" value="' + esc(link.icon || '') + '" placeholder="globe, heart, github, discord..." />'
		+ '</div></div>'
		+ '<div class="checkbox-row">'
		+ '<input type="checkbox" class="link-emphasize" id="link-emph-' + index + '"' + (link.emphasize ? ' checked' : '') + ' />'
		+ '<label for="link-emph-' + index + '">Emphasize (bounce animation)</label>'
		+ '</div></div>';
}

function createSocialHtml(social, index) {
	var options = PLATFORMS.map(function(p) {
		return '<option value="' + p + '"' + (social.platform === p ? ' selected' : '') + '>' + p + '</option>';
	}).join('');

	return '<div class="social-group" data-index="' + index + '">'
		+ '<button type="button" class="remove-btn" onclick="removeSocial(this)">Remove</button>'
		+ '<div class="row"><div>'
		+ '<label>Platform</label>'
		+ '<select class="social-platform">' + options + '</select>'
		+ '</div><div>'
		+ '<label>URL</label>'
		+ '<input type="url" class="social-url" value="' + esc(social.url) + '" />'
		+ '</div></div></div>';
}

/* ── Form: populate from config ── */

function populateForm(config) {
	$('cfg-name').value = config.name || '';
	$('cfg-bio').value = config.bio || '';
	$('cfg-avatar').value = config.avatar || '';
	$('cfg-header').value = config.header || '';

	var linksHtml = (config.links || []).map(createLinkHtml).join('');
	$('links-container').innerHTML = linksHtml;

	var socialsHtml = (config.socials || []).map(createSocialHtml).join('');
	$('socials-container').innerHTML = socialsHtml;

	var theme = config.theme || {};
	$('cfg-gradient').value = theme.gradient || '';
	$('cfg-color').value = theme.color || '';
	$('cfg-bgimage').value = theme.backgroundImage || '';
	$('cfg-textcolor').value = theme.textColor || '#ffffff';
	$('cfg-font').value = theme.font || 'Inter';
	$('cfg-buttonstyle').value = theme.buttonStyle || 'filled';
	$('cfg-buttonradius').value = theme.buttonRadius || '12px';
	$('cfg-buttoncolor').value = theme.buttonColor || '#6c63ff';
	$('cfg-buttontextcolor').value = theme.buttonTextColor || '#ffffff';
	$('cfg-container').value = theme.container || 'none';
	$('cfg-containerradius').value = theme.containerRadius || '12px';
	$('cfg-containercolor').value = theme.containerColor || '#ffffff';
}

/* ── Form: collect into config object ── */

function collectConfig() {
	var links = [];
	document.querySelectorAll('.link-group').forEach(function(g) {
		var title = g.querySelector('.link-title').value.trim();
		var url = g.querySelector('.link-url').value.trim();
		var icon = g.querySelector('.link-icon').value.trim();
		var emphasize = g.querySelector('.link-emphasize')?.checked || false;
		if (title && url) {
			var link = { title: title, url: url };
			if (icon) link.icon = icon;
			if (emphasize) link.emphasize = true;
			links.push(link);
		}
	});

	var socials = [];
	document.querySelectorAll('.social-group').forEach(function(g) {
		var platform = g.querySelector('.social-platform').value;
		var url = g.querySelector('.social-url').value.trim();
		if (platform && url) socials.push({ platform: platform, url: url });
	});

	return {
		name: $('cfg-name').value.trim(),
		bio: $('cfg-bio').value.trim(),
		avatar: $('cfg-avatar').value.trim(),
		header: $('cfg-header').value.trim() || undefined,
		links: links,
		socials: socials,
		theme: {
			gradient: $('cfg-gradient').value || undefined,
			color: $('cfg-color').value.trim() || undefined,
			backgroundImage: $('cfg-bgimage').value.trim() || undefined,
			textColor: $('cfg-textcolor').value,
			font: $('cfg-font').value.trim() || 'Inter',
			buttonStyle: $('cfg-buttonstyle').value,
			buttonColor: $('cfg-buttoncolor').value,
			buttonTextColor: $('cfg-buttontextcolor').value,
			buttonRadius: $('cfg-buttonradius').value.trim() || '12px',
			container: $('cfg-container').value || undefined,
			containerColor: $('cfg-containercolor').value,
			containerRadius: $('cfg-containerradius').value.trim() || '12px',
		},
	};
}

/* ── Preview ── */

async function updatePreview() {
	var cfg = collectConfig();
	try {
		var res = await fetch('/api/preview', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cfg),
		});
		if (res.ok) {
			$('preview-frame').srcdoc = await res.text();
		}
	} catch (e) { /* ignore preview errors */ }
}

function schedulePreviewUpdate() {
	clearTimeout(previewDebounce);
	previewDebounce = setTimeout(updatePreview, 300);
}

/* ── Save / Reset ── */

async function saveConfig() {
	var btn = $('save-btn');
	btn.disabled = true;
	btn.textContent = 'Saving...';
	try {
		var config = collectConfig();
		var res = await fetch('/api/config', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(config),
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

/* ── Add / Remove ── */

function addLink() {
	var container = $('links-container');
	var idx = container.querySelectorAll('.link-group').length;
	var html = createLinkHtml({ title: '', url: '', icon: '', emphasize: false }, idx);
	container.insertAdjacentHTML('beforeend', html);
	schedulePreviewUpdate();
}

function removeLink(btn) {
	btn.closest('.link-group').remove();
	schedulePreviewUpdate();
}

function addSocial() {
	var container = $('socials-container');
	var idx = container.querySelectorAll('.social-group').length;
	var html = createSocialHtml({ platform: 'twitter', url: '' }, idx);
	container.insertAdjacentHTML('beforeend', html);
	schedulePreviewUpdate();
}

function removeSocial(btn) {
	btn.closest('.social-group').remove();
	schedulePreviewUpdate();
}

/* ── Event listeners ── */

$('login-btn').addEventListener('click', login);
$('password').addEventListener('keydown', function(e) { if (e.key === 'Enter') login(); });
$('save-btn').addEventListener('click', saveConfig);
$('reset-btn').addEventListener('click', resetConfig);
$('add-link-btn').addEventListener('click', addLink);
$('add-social-btn').addEventListener('click', addSocial);
$('admin-form').addEventListener('input', schedulePreviewUpdate);
$('admin-form').addEventListener('change', schedulePreviewUpdate);

/* ── Init ── */
loadAdmin();
