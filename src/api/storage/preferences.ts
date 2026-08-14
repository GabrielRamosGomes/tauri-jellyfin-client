import { LazyStore } from '@tauri-apps/plugin-store';

export type ThemePreference = 'system' | 'light' | 'dark';

const store = new LazyStore('settings.json');
const KEY = 'jf_theme_preference';

export const preferencesStorage = {
	async getThemePreference(): Promise<ThemePreference | null> {
		return (await store.get<ThemePreference>(KEY)) ?? null;
	},

	async setThemePreference(preference: ThemePreference) {
		await store.set(KEY, preference);
		await store.save();
	},
};
