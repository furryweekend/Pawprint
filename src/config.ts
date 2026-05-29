import type { PawprintConfig } from './types';
import defaultConfig from '../config.json';

const KV_KEY = 'pawprint_config';

export async function getConfig(kv: KVNamespace): Promise<PawprintConfig> {
	const stored = await kv.get(KV_KEY, 'json');
	if (stored) return stored as PawprintConfig;
	return defaultConfig as PawprintConfig;
}

export async function saveConfig(kv: KVNamespace, config: PawprintConfig): Promise<void> {
	await kv.put(KV_KEY, JSON.stringify(config));
}
