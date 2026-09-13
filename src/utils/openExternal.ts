import { openUrl } from '@tauri-apps/plugin-opener';

export function openExternal(url?: string | null): void {
	if (url) openUrl(url);
}
