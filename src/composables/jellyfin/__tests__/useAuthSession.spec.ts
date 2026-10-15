import type { Api } from '@jellyfin/sdk';

import { authenticateUser } from '@/api/jellyfin/jellyfin';
import { authStorage } from '@/api/storage/auth';
import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
import { makeSession } from '@/test/fixtures/jellyfin';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { resetFakeStores } from '@/test/mocks/tauri-store';
import { deferred } from '@/test/utils';
import { mockIPC } from '@tauri-apps/api/mocks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));
vi.mock('@/api/jellyfin/jellyfin');

const home = makeSession({ serverUrl: 'http://home:8096', accessToken: 'home-token' });
const work = makeSession({ serverUrl: 'http://work:8096', accessToken: 'work-token' });
const api = { basePath: home.serverUrl } as Api;

const auth = useAuthSession();

beforeEach(() => {
	resetFakeStores();
	mockKeychain();
	auth.clearData();
	auth.errorMessage.value = '';
});

describe('login', () => {
	beforeEach(() => {
		auth.credentials.value = { username: 'neo', password: 'red-pill' };
	});

	it('signs in and persists the session as the active one', async () => {
		vi.mocked(authenticateUser).mockResolvedValue(home);

		await expect(auth.login(api)).resolves.toEqual(home);

		expect(auth.session.value).toEqual(home);
		await expect(authStorage.loadActiveSession()).resolves.toEqual(home);
	});

	it('sends the typed credentials, then drops the password from memory', async () => {
		let sent: unknown;
		vi.mocked(authenticateUser).mockImplementation(async (_, credentials) => {
			sent = { ...credentials };
			return home;
		});

		await auth.login(api);

		expect(sent).toEqual({ username: 'neo', password: 'red-pill' });
		expect(auth.credentials.value).toEqual({ username: 'neo', password: '' });
	});

	it('reports the server error and stays signed out when authentication fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(authenticateUser).mockRejectedValue(new Error('Invalid username or password'));

		await expect(auth.login(api)).resolves.toBeNull();

		expect(auth.errorMessage.value).toBe('Invalid username or password');
		expect(auth.session.value).toBeNull();
		await expect(authStorage.loadActiveSession()).resolves.toBeNull();
	});

	it('falls back to a generic message when the failure is not an Error', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(authenticateUser).mockRejectedValue('network down');

		await auth.login(api);

		expect(auth.errorMessage.value).toBe('Login failed.');
	});

	it('does not sign in when the token cannot be stored in the OS keychain', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(authenticateUser).mockResolvedValue(home);
		mockIPC(() => {
			throw new Error('keychain is locked');
		});

		await expect(auth.login(api)).resolves.toBeNull();

		expect(auth.session.value).toBeNull();
		expect(auth.errorMessage.value).toBe('keychain is locked');
	});

	it('clears the previous error when a retry succeeds', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(authenticateUser).mockRejectedValueOnce(new Error('Invalid username or password'));
		await auth.login(api);

		vi.mocked(authenticateUser).mockResolvedValueOnce(home);
		await auth.login(api);

		expect(auth.errorMessage.value).toBe('');
	});

	it('is loading only while the request is in flight', async () => {
		const request = deferred<typeof home>();
		vi.mocked(authenticateUser).mockReturnValue(request.promise);

		const pending = auth.login(api);
		expect(auth.loading.value).toBe(true);

		request.resolve(home);
		await pending;
		expect(auth.loading.value).toBe(false);
	});
});

describe('activate', () => {
	it('switches to another saved server', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);

		await expect(auth.activate(home.serverUrl)).resolves.toEqual(home);

		expect(auth.session.value).toEqual(home);
		await expect(authStorage.getActiveServerUrl()).resolves.toBe(home.serverUrl);
	});

	it('keeps the current server when the target has no usable saved session', async () => {
		await authStorage.saveSession(home);
		auth.session.value = home;

		await expect(auth.activate('http://unknown:8096')).resolves.toBeNull();

		expect(auth.session.value).toEqual(home);
		await expect(authStorage.getActiveServerUrl()).resolves.toBe(home.serverUrl);
	});
});

describe('restoreActive', () => {
	it('restores the last active session after an app restart', async () => {
		await authStorage.saveSession(home);

		await expect(auth.restoreActive()).resolves.toEqual(home);

		expect(auth.session.value).toEqual(home);
	});

	it('returns null on first launch', async () => {
		await expect(auth.restoreActive()).resolves.toBeNull();

		expect(auth.session.value).toBeNull();
	});
});

describe('logout', () => {
	it('signs out of memory and storage but keeps the server in the saved list', async () => {
		await authStorage.saveSession(home);
		auth.session.value = home;
		auth.credentials.value = { username: 'neo', password: '' };

		await auth.logout();

		expect(auth.session.value).toBeNull();
		expect(auth.credentials.value).toEqual({ username: '', password: '' });
		await expect(auth.restoreActive()).resolves.toBeNull();
		await expect(authStorage.listSessions()).resolves.toHaveLength(1);
	});
});
