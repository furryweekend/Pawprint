import type { Theme } from './types';

const gradients: Record<string, string> = {
	sunset: 'linear-gradient(135deg, #f97316, #ec4899)',
	ocean: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
	forest: 'linear-gradient(135deg, #22c55e, #14b8a6)',
	midnight: 'linear-gradient(135deg, #1e1b4b, #312e81)',
	aurora: 'linear-gradient(135deg, #a855f7, #06b6d4)',
	ember: 'linear-gradient(135deg, #dc2626, #f59e0b)',
	lavender: 'linear-gradient(135deg, #c084fc, #f9a8d4)',
	cosmic: 'linear-gradient(135deg, #6366f1, #ec4899, #f97316)',
	slate: 'linear-gradient(135deg, #334155, #1e293b)',
	candy: 'linear-gradient(135deg, #f472b6, #c084fc, #818cf8)',
};

export function getBackground(theme: Theme): string {
	if (theme.backgroundImage) {
		return `url('${theme.backgroundImage}') center/cover no-repeat fixed`;
	}
	if (theme.color) {
		return theme.color;
	}
	return gradients[theme.gradient ?? 'sunset'] ?? gradients.sunset;
}

export function getButtonStyles(theme: Theme): string {
	const color = theme.buttonColor ?? '#6c63ff';
	const textColor = theme.buttonTextColor ?? '#ffffff';
	const radius = theme.buttonRadius ?? '12px';
	const style = theme.buttonStyle ?? 'filled';

	const base = `border-radius: ${radius}; padding: 14px 20px; text-decoration: none; display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 500; transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; width: 100%; box-sizing: border-box; justify-content: center;`;

	if (style === 'outlined') {
		return `${base} background: transparent; color: ${color}; border: 2px solid ${color};`;
	}
	if (style === 'soft') {
		return `${base} background: ${color}22; color: ${color}; border: none; backdrop-filter: blur(8px);`;
	}
	return `${base} background: ${color}; color: ${textColor}; border: none;`;
}

export function getFontImport(theme: Theme): string {
	const font = theme.font ?? 'Inter';
	const encoded = encodeURIComponent(font);
	return `@import url('https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap');`;
}

export { gradients };
