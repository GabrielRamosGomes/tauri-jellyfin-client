import { preferencesStorage, type ThemePreference } from '@/api/storage/preferences';
import { ref } from 'vue';

const preference = ref<ThemePreference>('system');
let initialized = false;

function applyTheme(pref: ThemePreference) {
	const root = document.documentElement;
	if (pref === 'system') {
		root.removeAttribute('data-theme');
	} else {
		root.setAttribute('data-theme', pref);
	}
}

export function useTheme() {
	async function init() {
		if (initialized) return;
		initialized = true;

		preference.value = (await preferencesStorage.getThemePreference()) ?? 'system';
		applyTheme(preference.value);
	}

	async function setPreference(pref: ThemePreference) {
		preference.value = pref;
		applyTheme(pref);
		await preferencesStorage.setThemePreference(pref);
	}

	return { preference, init, setPreference };
}
