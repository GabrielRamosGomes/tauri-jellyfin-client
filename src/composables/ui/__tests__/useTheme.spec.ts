import type { useTheme as UseTheme } from '@/composables/ui/useTheme';

import { resetFakeStores } from '@/test/mocks/tauri-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));

// useTheme only initialises once per app launch, so each test (and each simulated restart)
// loads a fresh copy of the module. The fake store's data survives the reload like a file on disk.
async function launchApp(): Promise<ReturnType<typeof UseTheme>> {
	vi.resetModules();
	const { useTheme } = await import('@/composables/ui/useTheme');
	return useTheme();
}

const appliedTheme = () => document.documentElement.getAttribute('data-theme');

beforeEach(() => {
	resetFakeStores();
	document.documentElement.removeAttribute('data-theme');
});

describe('useTheme', () => {
	it('follows the system theme on first launch', async () => {
		const theme = await launchApp();

		await theme.init();

		expect(theme.preference.value).toBe('system');
		expect(appliedTheme()).toBeNull();
	});

	it('applies the chosen theme immediately', async () => {
		const theme = await launchApp();
		await theme.init();

		await theme.setPreference('dark');

		expect(appliedTheme()).toBe('dark');
	});

	it('restores the chosen theme on the next launch', async () => {
		const firstRun = await launchApp();
		await firstRun.setPreference('voltaic');
		document.documentElement.removeAttribute('data-theme');

		const nextRun = await launchApp();
		await nextRun.init();

		expect(nextRun.preference.value).toBe('voltaic');
		expect(appliedTheme()).toBe('voltaic');
	});

	it('switching back to system removes the forced theme', async () => {
		const theme = await launchApp();
		await theme.setPreference('light');

		await theme.setPreference('system');

		expect(appliedTheme()).toBeNull();
	});
});
