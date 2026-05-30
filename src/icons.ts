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

const linkIcons: Record<string, string> = {
	globe: '<i class="fa-solid fa-globe"></i>',
	pencil: '<i class="fa-solid fa-pencil"></i>',
	heart: '<i class="fa-solid fa-heart"></i>',
	star: '<i class="fa-solid fa-star"></i>',
	link: '<i class="fa-solid fa-link"></i>',
	music: '<i class="fa-solid fa-music"></i>',
	shop: '<i class="fa-solid fa-shop"></i>',
	coffee: '<i class="fa-solid fa-mug-hot"></i>',
	camera: '<i class="fa-solid fa-camera"></i>',
	book: '<i class="fa-solid fa-book"></i>',
};

export function getSocialIcon(platform: string): string {
	return socialIcons[platform.toLowerCase()] ?? '';
}

export function getLinkIcon(icon: string): string {
	return linkIcons[icon] ?? linkIcons.link ?? '';
}
