export interface LinkItem {
	title: string;
	url: string;
	icon?: string;
}

export interface SocialItem {
	platform: string;
	url: string;
}

export interface Theme {
	gradient?: string;
	color?: string;
	backgroundImage?: string;
	textColor?: string;
	buttonStyle?: 'filled' | 'outlined' | 'soft';
	buttonColor?: string;
	buttonTextColor?: string;
	buttonRadius?: string;
	font?: string;
}

export interface PawprintConfig {
	name: string;
	bio: string;
	avatar: string;
	header?: string;
	links: LinkItem[];
	socials: SocialItem[];
	theme: Theme;
}
