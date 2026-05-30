import { ImageResponse, loadGoogleFont } from 'workers-og';
import type { PawprintConfig } from './types';

const WIDTH = 1200;
const HEIGHT = 630;
const BIO_MAX_LENGTH = 140;
const CARD_BG = '#f6f6f6';
const CARD_TEXT = '#1a1a2e';

// workers-og parses the card via HTMLRewriter and does not decode html entities,
// so text is emitted raw. Only `<`/`>` could break parsing
function cleanText(str: string): string {
	return str.replace(/[<>]/g, '');
}

function truncate(str: string, max: number): string {
	return str.length > max ? `${str.slice(0, max).trimEnd()}...` : str;
}

function buildCardHtml(config: PawprintConfig, name: string, bio: string): string {
	const theme = config.theme;
	const fontFamily = (theme.font ?? 'Inter').replace(/\+/g, ' ');

	const avatar = config.avatar
		? `<img src="${config.avatar}" width="200" height="200" style="border-radius:100px;object-fit:cover;" />`
		: '';

	const text =
		`<div style="display:flex;flex-direction:column;max-width:760px;">` +
		`<div style="display:flex;font-size:72px;font-weight:700;line-height:1.1;">${name}</div>` +
		`<div style="display:flex;font-size:34px;font-weight:400;line-height:1.4;margin-top:24px;opacity:0.7;">${bio}</div>` +
		`</div>`;

	return (
		`<div style="display:flex;flex-direction:column;justify-content:space-between;width:${WIDTH}px;height:${HEIGHT}px;padding:80px;background:${CARD_BG};color:${CARD_TEXT};font-family:'${fontFamily}';">` +
		`<div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">` +
		text +
		avatar +
		`</div>` +
		`</div>`
	);
}

export async function renderOgImage(config: PawprintConfig): Promise<Response> {
	const family = (config.theme.font ?? 'Inter').replace(/\+/g, ' ');
	const name = cleanText(config.name);
	const bio = truncate(cleanText(config.bio), BIO_MAX_LENGTH);

	const [bold, regular] = await Promise.all([
		loadGoogleFont({ family, weight: 700 }),
		loadGoogleFont({ family, weight: 400 }),
	]);

	return new ImageResponse(buildCardHtml(config, name, bio), {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: family, data: bold, weight: 700, style: 'normal' },
			{ name: family, data: regular, weight: 400, style: 'normal' },
		],
	});
}
