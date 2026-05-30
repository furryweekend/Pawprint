var PLATFORMS = ['twitter', 'github', 'instagram', 'youtube', 'discord', 'twitch', 'mastodon', 'bluesky', 'telegram', 'linkedin', 'tiktok', 'email'];

var GRADIENTS = {
	sunset: 'linear-gradient(135deg, #f97316, #ec4899)',
	ocean: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
	forest: 'linear-gradient(135deg, #06350a, #000709)',
	midnight: 'linear-gradient(135deg, #1e1b4b, #312e81)',
	aurora: 'linear-gradient(135deg, #a855f7, #06b6d4)',
	ember: 'linear-gradient(135deg, #dc2626, #f59e0b)',
	lavender: 'linear-gradient(135deg, #c084fc, #f9a8d4)',
	cosmic: 'linear-gradient(135deg, #6366f1, #ec4899, #f97316)',
	slate: 'linear-gradient(135deg, #334155, #1e293b)',
	candy: 'linear-gradient(135deg, #f472b6, #c084fc, #818cf8)',
};

var SOCIAL_ICONS = {
	twitter: '<i class="fa-brands fa-x-twitter"></i>',
	github: '<i class="fa-brands fa-github"></i>',
	instagram: '<i class="fa-brands fa-instagram"></i>',
	youtube: '<i class="fa-brands fa-youtube"></i>',
	discord: '<i class="fa-brands fa-discord"></i>',
	twitch: '<i class="fa-brands fa-twitch"></i>',
	mastodon: '<i class="fa-brands fa-mastodon"></i>',
	bluesky: '<i class="fa-brands fa-bluesky"></i>',
	telegram: '<i class="fa-brands fa-telegram"></i>',
	linkedin: '<i class="fa-brands fa-linkedin"></i>',
	tiktok: '<i class="fa-brands fa-tiktok"></i>',
	email: '<i class="fa-solid fa-envelope"></i>',
};

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

/* ── Preview rendering ── */

function getPreviewBg(theme) {
	if (theme.backgroundImage) return "url('" + theme.backgroundImage + "') center/cover no-repeat fixed";
	if (theme.color) return theme.color;
	return GRADIENTS[theme.gradient || 'sunset'] || GRADIENTS.sunset;
}

function getPreviewButtonCss(theme) {
	var color = theme.buttonColor || '#6c63ff';
	var textColor = theme.buttonTextColor || '#ffffff';
	var radius = theme.buttonRadius || '12px';
	var style = theme.buttonStyle || 'filled';
	var base = 'border-radius:' + radius + ';padding:14px 20px;text-decoration:none;display:flex;align-items:center;gap:10px;font-size:1rem;font-weight:500;transition:transform .15s ease,box-shadow .15s ease;cursor:pointer;width:100%;box-sizing:border-box;justify-content:center;';
	if (style === 'outlined') return base + 'background:transparent;color:' + color + ';border:2px solid ' + color + ';';
	if (style === 'soft') return base + 'background:' + color + '22;color:' + color + ';border:none;backdrop-filter:blur(8px);';
	return base + 'background:' + color + ';color:' + textColor + ';border:none;';
}

function getPreviewContainerCss(theme) {
	var radius = theme.containerRadius || '12px';
	var style = theme.container || 'none';
	var color = theme.containerColor || '#ffffff';
	var base = 'border-radius:' + radius + ';padding:25px;';
	if (style === 'filled') return base + 'background:' + color + ';box-shadow:0 10px 15px -3px rgb(0 0 0/0.1),0 4px 6px -4px rgb(0 0 0/0.1);';
	if (style === 'outlined') return base + 'border:2px solid ' + color + ';';
	if (style === 'glass') return base + 'backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);background:rgba(255,255,255,0.2);box-shadow:0 4px 30px rgba(0,0,0,0.1);border:1px solid rgba(255,255,255,0.3);';
	return '';
}

function getIconHtml(name) {
	return SOCIAL_ICONS[name.toLowerCase()] || '<i class="fa-solid fa-' + name.toLowerCase() + '"></i>';
}

function renderPreviewHtml(cfg) {
	var theme = cfg.theme || {};
	var bg = getPreviewBg(theme);
	var btnCss = getPreviewButtonCss(theme);
	var contCss = getPreviewContainerCss(theme);
	var textColor = theme.textColor || '#ffffff';
	var fontFamily = (theme.font || 'Inter').replaceAll('+', ' ');
	var fontImport = "@import url('https://fonts.googleapis.com/css2?family=" + encodeURIComponent(fontFamily) + ":wght@400;500;600;700&display=swap');";
	var isBgImage = !!theme.backgroundImage;

	var headerHtml = cfg.header
		? '<div class="header"><img src="' + esc(cfg.header) + '" alt="Header" /></div>'
		: '';

	var linksHtml = (cfg.links || []).map(function(link) {
		var icon = link.icon ? '<span class="link-icon">' + getIconHtml(link.icon) + '</span>' : '';
		var emphClass = link.emphasize ? ' bounce-button' : '';
		return '<a href="#" class="link-button' + emphClass + '" onclick="return false">' + icon + '<span>' + esc(link.title) + '</span></a>';
	}).join('');

	var socialsHtml = (cfg.socials || []).map(function(s) {
		return '<a href="#" class="social-icon" onclick="return false" title="' + esc(s.platform) + '">' + getIconHtml(s.platform) + '</a>';
	}).join('');

	var css = fontImport
		+ ' *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}'
		+ 'body{font-family:"' + fontFamily + '",system-ui,sans-serif;color:' + textColor + ';min-height:100vh;display:flex;justify-content:space-between;flex-direction:column;align-items:flex-start;padding:1rem;background:' + bg + ';' + (isBgImage ? 'background-size:cover;background-position:center;background-attachment:fixed;' : '') + '}'
		+ '.container{width:100%;max-width:480px;display:flex;flex-direction:column;align-items:center;gap:1.5rem;margin:auto;' + contCss + '}'
		+ '.header{width:100%;border-radius:16px;overflow:hidden;max-height:200px}.header img{width:100%;height:100%;object-fit:cover}'
		+ '.avatar{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid ' + textColor + '33;box-shadow:0 4px 20px rgba(0,0,0,0.15)}'
		+ '.name{font-size:1.5rem;font-weight:700;text-align:center}.bio{font-size:0.95rem;opacity:0.85;text-align:center;line-height:1.5;max-width:360px}'
		+ '.links{width:100%;display:flex;flex-direction:column;gap:0.75rem}'
		+ '.link-button{' + btnCss + '}.link-button:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.2)}'
		+ '.link-icon{flex-shrink:0;display:flex;align-items:center;font-size:1.1rem}'
		+ '.socials{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-top:0.5rem}'
		+ '.social-icon{color:' + textColor + ';opacity:0.7;transition:opacity .15s ease,transform .15s ease;font-size:1.5rem;text-decoration:none}.social-icon:hover{opacity:1;transform:scale(1.15)}'
		+ '.footer{margin:0 auto;opacity:0.4;font-size:0.75rem}.footer a{color:inherit;text-decoration:none}'
		+ '.bounce-button{animation:bounce 2s infinite}@keyframes bounce{0%{transform:scale(1)}10%{transform:scale(1.05)}25%{transform:scale(1)}}';

	var body = headerHtml
		+ (cfg.avatar ? '<img class="avatar" src="' + esc(cfg.avatar) + '" alt="' + esc(cfg.name) + '" />' : '')
		+ '<h1 class="name">' + esc(cfg.name || '') + '</h1>'
		+ '<p class="bio">' + esc(cfg.bio || '') + '</p>'
		+ '<div class="links">' + linksHtml + '</div>'
		+ (socialsHtml ? '<div class="socials">' + socialsHtml + '</div>' : '');

	return '<!DOCTYPE html><html><head>'
		+ '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />'
		+ '<style>' + css + '</style></head><body>'
		+ '<div></div><div class="container">' + body + '</div>'
		+ '<div class="footer"><a href="https://github.com/furryweekend/Pawprint">Powered by Pawprint</a></div>'
		+ '</body></html>';
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

/* ── Preview update ── */

function updatePreview() {
	var cfg = collectConfig();
	$('preview-frame').srcdoc = renderPreviewHtml(cfg);
}

function schedulePreviewUpdate() {
	clearTimeout(previewDebounce);
	previewDebounce = setTimeout(updatePreview, 300);
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
