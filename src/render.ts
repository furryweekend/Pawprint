import type { PawprintConfig } from './types';
import { getBackground, getButtonStyles, getContainerStyles, getFontImport } from './theme';
import { getSocialIcon, getLinkIcon } from './icons';

function esc(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function buildStyles(config: PawprintConfig): string {
	const theme = config.theme;
	const textColor = theme.textColor ?? '#ffffff';
	const fontFamily = (theme.font ?? 'Inter').replace(/\+/g, ' ');
	const bg = getBackground(theme);
	const isBackgroundImage = !!theme.backgroundImage;

	return `
		${getFontImport(theme)}

		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

		body {
			font-family: '${fontFamily}', system-ui, -apple-system, sans-serif;
			color: ${textColor};
			min-height: 100vh;
			display: flex;
			justify-content: space-between;
			flex-direction: column;
			align-items: flex-start;
			padding: 1rem 1rem;
			background: ${bg};
			${isBackgroundImage ? 'background-size: cover; background-position: center; background-attachment: fixed;' : ''}
		}

		.container {
			width: 100%;
			max-width: 480px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1.5rem;
			margin: auto;
			${getContainerStyles(theme)}
		}

		.header { width: 100%; border-radius: 16px; overflow: hidden; max-height: 200px; }
		.header img { width: 100%; height: 100%; object-fit: cover; }

		.avatar {
			width: 120px;
			height: 120px;
			border-radius: 50%;
			object-fit: cover;
			border: 3px solid ${textColor}33;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		}

		.name { font-size: 1.5rem; font-weight: 700; text-align: center; }

		.bio {
			font-size: 0.95rem;
			opacity: 0.85;
			text-align: center;
			line-height: 1.5;
			max-width: 360px;
		}

		.links { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; }
		.link-button { ${getButtonStyles(theme)} }
		.link-button:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); }
		.link-icon { flex-shrink: 0; display: flex; align-items: center; font-size: 1.1rem; }

		.socials { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
		.social-icon {
			color: ${textColor};
			opacity: 0.7;
			transition: opacity 0.15s ease, transform 0.15s ease;
			font-size: 1.5rem;
			text-decoration: none;
		}
		.social-icon:hover { opacity: 1; transform: scale(1.15); }

		.footer { margin: 0 auto; opacity: 0.4; font-size: 0.75rem; }
		.footer a { color: inherit; text-decoration: none; }
		.footer a:hover { text-decoration: underline; }

		.bounce-button { animation: bounce 2s infinite; }
		@keyframes bounce {
			0% { transform: scale(1); }
			10% { transform: scale(1.05); }
			25% { transform: scale(1); }
		}`;
}

function buildMetaTags(config: PawprintConfig, origin?: string): string {
	const sp = config.socialPreview ?? {};
	const title = sp.title || config.name;
	const description = sp.description || config.bio;
	const image = sp.image || (origin ? `${origin}/og.png` : config.avatar);

	const tags = [
		`<meta property="og:type" content="website" />`,
		`<meta property="og:title" content="${esc(title)}" />`,
		`<meta property="og:description" content="${esc(description)}" />`,
		`<meta name="twitter:card" content="summary_large_image" />`,
		`<meta name="twitter:title" content="${esc(title)}" />`,
		`<meta name="twitter:description" content="${esc(description)}" />`,
	];

	if (image) {
		tags.push(`<meta property="og:image" content="${esc(image)}" />`);
		tags.push(`<meta name="twitter:image" content="${esc(image)}" />`);
	}

	return tags.join('\n\t');
}

function buildLinksHtml(config: PawprintConfig): string {
	return config.links
		.map((link, i) => {
			const icon = link.icon ? `<span class="link-icon">${getLinkIcon(link.icon)}</span>` : '';
			const emphClass = link.emphasize ? ' bounce-button' : '';
			return `<a href="/click/${i}" class="link-button${emphClass}" rel="noopener noreferrer" target="_blank">${icon}<span>${esc(link.title)}</span></a>`;
		})
		.join('\n\t\t\t');
}

function buildSocialsHtml(config: PawprintConfig): string {
	return config.socials
		.map((social) => {
			return `<a href="${esc(social.url)}" class="social-icon" rel="noopener noreferrer" target="_blank" title="${esc(social.platform)}">${getSocialIcon(social.platform)}</a>`;
		})
		.join('\n\t\t\t');
}

export function renderProfilePage(config: PawprintConfig, origin?: string): string {
	const headerHtml = config.header
		? `<div class="header"><img src="${esc(config.header)}" alt="Header" /></div>`
		: '';

	const avatarHtml = config.avatar
		? `<img class="avatar" src="${esc(config.avatar)}" alt="${esc(config.name)}" />`
		: '';

	const socialsSection = config.socials.length > 0
		? `<div class="socials">${buildSocialsHtml(config)}</div>`
		: '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>${esc(config.name)}</title>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
	<meta name="description" content="${esc(config.bio)}" />
	${buildMetaTags(config, origin)}
	<style>${buildStyles(config)}</style>
</head>
<body>
	<div></div>
	<div class="container">
		${headerHtml}
		${avatarHtml}
		<h1 class="name">${esc(config.name)}</h1>
		<p class="bio">${esc(config.bio)}</p>
		<div class="links">
			${buildLinksHtml(config)}
		</div>
		${socialsSection}
	</div>
	<div class="footer">
		<a href="https://github.com/furryweekend/Pawprint">Powered by Pawprint</a>
	</div>
</body>
</html>`;
}
