import { authStorage } from '@/api/storage/auth';
import { useServers } from '@/composables/jellyfin/useServers';
import { makeSession } from '@/test/fixtures/jellyfin';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { resetFakeStores } from '@/test/mocks/tauri-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));

const home = makeSession({ serverUrl: 'http://home:8096' });
const work = makeSession({ serverUrl: 'http://work:8096' });

const servers = useServers();

beforeEach(async () => {
	resetFakeStores();
	mockKeychain();
	await servers.refresh();
});

describe('useServers', () => {
	it('lists the saved servers and which one is active', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);

		await servers.refresh();

		expect(servers.servers.value.map((server) => server.serverUrl)).toEqual([
			home.serverUrl,
			work.serverUrl,
		]);
		expect(servers.activeServerUrl.value).toBe(work.serverUrl);
	});

	it('removing the active server updates both the list and the active server', async () => {
		await authStorage.saveSession(home);
		await authStorage.saveSession(work);
		await servers.refresh();

		await servers.remove(work.serverUrl);

		expect(servers.servers.value.map((server) => server.serverUrl)).toEqual([home.serverUrl]);
		expect(servers.activeServerUrl.value).toBeNull();
	});
});
