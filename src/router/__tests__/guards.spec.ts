import type { ConnectedServer } from '@/api/jellyfin/types';
import type { Api } from '@jellyfin/sdk';

import { connectToServer } from '@/api/jellyfin/jellyfin';
import { authStorage } from '@/api/storage/auth';
import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
import { restoreSession } from '@/router/guards';
import { makeSession } from '@/test/fixtures/jellyfin';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { resetFakeStores } from '@/test/mocks/tauri-store';
import { createTestRouter } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));
vi.mock('@/api/jellyfin/jellyfin');

const saved = makeSession({ serverUrl: 'http://home:8096', accessToken: 'saved-token' });

function reachable(serverUrl: string): ConnectedServer {
	return { serverUrl, info: { ServerName: 'Home' }, api: { basePath: serverUrl } as Api };
}

async function openApp(path: string) {
	const router = createTestRouter();
	router.beforeEach(restoreSession);
	await router.push(path);
	return router.currentRoute.value;
}

beforeEach(() => {
	resetFakeStores();
	mockKeychain();
	signOut();
});

describe('restoreSession', () => {
	it('lets the login page open without touching storage', async () => {
		const spy = vi.spyOn(authStorage, 'getActiveServerUrl');

		const route = await openApp('/login');

		expect(route.name).toBe('login');
		expect(spy).not.toHaveBeenCalled();
	});

	it('sends a first-time user to login, remembering where they were going', async () => {
		const route = await openApp('/library/movies');

		expect(route.name).toBe('login');
		expect(route.query.redirect).toBe('/library/movies');
	});

	it('restores the saved session on launch and reconnects with its token', async () => {
		await authStorage.saveSession(saved);
		vi.mocked(connectToServer).mockResolvedValue(reachable(saved.serverUrl));

		const route = await openApp('/library/movies');

		expect(route.name).toBe('library');
		expect(useAuthSession().session.value).toEqual(saved);
		expect(useServerConnection().api.value?.accessToken).toBe('saved-token');
	});

	it('signs out to login when the saved server cannot be reached, keeping it in the list', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		await authStorage.saveSession(saved);
		vi.mocked(connectToServer).mockRejectedValue(new Error('timeout'));

		const route = await openApp('/item/42');

		expect(route.name).toBe('login');
		expect(route.query.redirect).toBe('/item/42');
		expect(useAuthSession().session.value).toBeNull();
		await expect(authStorage.getActiveServerUrl()).resolves.toBeNull();
		await expect(authStorage.listSessions()).resolves.toHaveLength(1);
	});

	it('skips restoring once the app is already connected', async () => {
		signIn();
		const spy = vi.spyOn(authStorage, 'getActiveServerUrl');

		const route = await openApp('/settings');

		expect(route.name).toBe('settings');
		expect(spy).not.toHaveBeenCalled();
		expect(connectToServer).not.toHaveBeenCalled();
	});
});
