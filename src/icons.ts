const socialIcons: Record<string, string> = {
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

function faIcon(name: string): string {
	return `<i class="fa-solid fa-${name}"></i>`;
}

export function getSocialIcon(platform: string): string {
	return socialIcons[platform.toLowerCase()] ?? faIcon(platform.toLowerCase());
}

export function getLinkIcon(icon: string): string {
	return socialIcons[icon.toLowerCase()] ?? faIcon(icon.toLowerCase());
}
