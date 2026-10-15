import { authStorage } from '@/api/storage/auth';
import { makeSession } from '@/test/fixtures/jellyfin';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { readFakeStore, resetFakeStores } from '@/test/mocks/tauri-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));

const home = makeSession({ serverUrl: 'http://home:8096', accessToken: 'home-token' });
const work = makeSession({
	serverUrl: 'http://work:8096',
	serverId: 'server-2',
	accessToken: 'work-token',
});

let keychainEntries: Map<string, string>;

beforeEach(() => {
	resetFakeStores();
	keychainEntries = mockKeychain();
});

describe('saveSession', () => {
	it('can be read back with its access token', async () => {
		await authStorage.saveSession(home);

		await expect(authStorage.getSession(home.serverUrl)).resolves.toEqual(home);
	});

	it('keeps the access token in the OS keychain and out of the settings file', async () => {
		await authStorage.saveSession(home);

		expect(JSON.stringify(readFakeStore('settings.json'))).not.toContain('home-token');
		expect(keychainEntries.get(home.serverUrl)).toBe('home-token');
	});

	it('makes the saved server the active one', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);

		await expect(authStorage.getActiveServerUrl()).resolves.toBe(work.serverUrl);
	});

	it('keeps previously saved servers when another one is added', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);

		const urls = (await authStorage.listSessions()).map((session) => session.serverUrl);
		expect(urls).toEqual([home.serverUrl, work.serverUrl]);
	});

	it('replaces the stored session when logging in again on the same server', async () => {
		const relogin = { ...home, userId: 'user-2', username: 'trinity', accessToken: 'new-token' };

		await authStorage.saveSession(home);
		await authStorage.saveSession(relogin);

		await expect(authStorage.listSessions()).resolves.toHaveLength(1);
		await expect(authStorage.getSession(home.serverUrl)).resolves.toEqual(relogin);
	});
});

describe('getSession', () => {
	it('returns null for a server that was never saved', async () => {
		await expect(authStorage.getSession('http://unknown:8096')).resolves.toBeNull();
	});

	it('returns null when the token is gone from the OS keychain, forcing a fresh login', async () => {
		await authStorage.saveSession(home);
		keychainEntries.clear();

		await expect(authStorage.getSession(home.serverUrl)).resolves.toBeNull();
	});
});

describe('listSessions', () => {
	it('returns an empty list on first launch', async () => {
		await expect(authStorage.listSessions()).resolves.toEqual([]);
	});

	it('lists saved servers without their access tokens', async () => {
		await authStorage.saveSession(home);

		const [listed] = await authStorage.listSessions();
		expect(listed).not.toHaveProperty('accessToken');
	});
});

describe('clearSession', () => {
	it('forgets the server and deletes its token', async () => {
		await authStorage.saveSession(home);

		await authStorage.clearSession(home.serverUrl);

		await expect(authStorage.listSessions()).resolves.toEqual([]);
		expect(keychainEntries.has(home.serverUrl)).toBe(false);
	});

	it('clears the active server when removing the active one', async () => {
		await authStorage.saveSession(home);

		await authStorage.clearSession(home.serverUrl);

		await expect(authStorage.getActiveServerUrl()).resolves.toBeNull();
	});

	it('keeps the active server when removing a different one', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);

		await authStorage.clearSession(home.serverUrl);

		await expect(authStorage.getActiveServerUrl()).resolves.toBe(work.serverUrl);
		await expect(authStorage.getSession(work.serverUrl)).resolves.toEqual(work);
	});
});

describe('signing out (clearActiveServerUrl)', () => {
	it('leaves no active session but remembers the server for the server list', async () => {
		await authStorage.saveSession(home);

		await authStorage.clearActiveServerUrl();

		await expect(authStorage.loadActiveSession()).resolves.toBeNull();
		await expect(authStorage.getSession(home.serverUrl)).resolves.toEqual(home);
	});
});

describe('loadActiveSession', () => {
	it('returns null on first launch', async () => {
		await expect(authStorage.loadActiveSession()).resolves.toBeNull();
	});

	it('restores the active server session after a restart', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);
		await authStorage.setActiveServerUrl(home.serverUrl);

		await expect(authStorage.loadActiveSession()).resolves.toEqual(home);
	});

	it('returns null when the active server points at a session that was never saved', async () => {
		await authStorage.setActiveServerUrl('http://unknown:8096');

		await expect(authStorage.loadActiveSession()).resolves.toBeNull();
	});
});
