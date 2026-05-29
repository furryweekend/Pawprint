import type { PawprintConfig } from './types';
import {getBackground, getButtonStyles, getContainerStyles, getFontImport} from './theme';
import { getSocialIcon, getLinkIcon } from './icons';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function renderProfilePage(config: PawprintConfig): string {
	const theme = config.theme;
	const bg = getBackground(theme);
	const buttonCss = getButtonStyles(theme);
    const containerCss = getContainerStyles(theme);
	const fontImport = getFontImport(theme);
	const textColor = theme.textColor ?? '#ffffff';
	const fontFamily = theme.font ?? 'Inter';
	const isBackgroundImage = !!theme.backgroundImage;

	const headerHtml = config.header
		? `<div class="header"><img src="${escapeHtml(config.header)}" alt="Header" /></div>`
		: '';

	const linksHtml = config.links
		.map((link, i) => {
			const iconHtml = link.icon
				? `<span class="link-icon">${getLinkIcon(link.icon)}</span>`
				: '';
			return `<a href="/click/${i}" class="link-button ${link.emphasize ? "bounce-button" : ""}" rel="noopener noreferrer" target="_blank">${iconHtml}<span>${escapeHtml(link.title)}</span></a>`;
		})
		.join('\n\t\t\t');

	const socialsHtml = config.socials
		.map((social) => {
			return `<a href="${escapeHtml(social.url)}" class="social-icon" rel="noopener noreferrer" target="_blank" title="${escapeHtml(social.platform)}">${getSocialIcon(social.platform)}</a>`;
		})
		.join('\n\t\t\t');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>${escapeHtml(config.name)}</title>
	<meta name="description" content="${escapeHtml(config.bio)}" />
	<meta property="og:title" content="${escapeHtml(config.name)}" />
	<meta property="og:description" content="${escapeHtml(config.bio)}" />
	${config.avatar ? `<meta property="og:image" content="${escapeHtml(config.avatar)}" />` : ''}
	<style>
		${fontImport}

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
			${containerCss}
		}

		.header {
			width: 100%;
			border-radius: 16px;
			overflow: hidden;
			max-height: 200px;
		}

		.header img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.avatar {
			width: 120px;
			height: 120px;
			border-radius: 50%;
			object-fit: cover;
			border: 3px solid ${textColor}33;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		}

		.name {
			font-size: 1.5rem;
			font-weight: 700;
			text-align: center;
		}

		.bio {
			font-size: 0.95rem;
			opacity: 0.85;
			text-align: center;
			line-height: 1.5;
			max-width: 360px;
		}

		.links {
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.link-button {
			${buttonCss}
		}

		.link-button:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		}

		.link-icon {
			width: 20px;
			height: 20px;
			flex-shrink: 0;
			display: flex;
			align-items: center;
		}

		.link-icon svg {
			width: 100%;
			height: 100%;
		}

		.socials {
			display: flex;
			gap: 1rem;
			flex-wrap: wrap;
			justify-content: center;
			margin-top: 0.5rem;
		}

		.social-icon {
			width: 28px;
			height: 28px;
			color: ${textColor};
			opacity: 0.7;
			transition: opacity 0.15s ease, transform 0.15s ease;
		}

		.social-icon:hover {
			opacity: 1;
			transform: scale(1.15);
		}

		.social-icon svg {
			width: 100%;
			height: 100%;
		}

		.footer {
			margin: 0 auto;
			opacity: 0.4;
			font-size: 0.75rem;
		}

		.footer a {
			color: inherit;
			text-decoration: none;
		}

		.footer a:hover {
			text-decoration: underline;
		}
		
		.bounce-button {
		    animation: bounce 2s infinite;
		}
		
		@keyframes bounce {
              0% {
                transform: scale(1);
              }
              10% {
                transform: scale(1.05);
              }
              25% {
                transform: scale(1);
              }
        }
	</style>
</head>
<body>
    <div></div>
	<div class="container">
		${headerHtml}
        ${config.avatar ? `<img class="avatar" src="${escapeHtml(config.avatar)}" alt="${escapeHtml(config.name)}" />` : ''}
        <h1 class="name">${escapeHtml(config.name)}</h1>
        <p class="bio">${escapeHtml(config.bio)}</p>
        <div class="links">
            ${linksHtml}
        </div>
		${config.socials.length > 0 ? `<div class="socials">${socialsHtml}\n\t\t</div>` : ''}
	</div>
    <div class="footer">
        <a href="https://github.com/furryweekend/Pawprint">Powered by Pawprint</a>
    </div>
</body>
</html>`;
}
