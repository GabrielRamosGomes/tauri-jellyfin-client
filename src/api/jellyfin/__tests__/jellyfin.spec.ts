import type { Api, Jellyfin } from '@jellyfin/sdk';

import { authenticateUser, connectToServer, createClient } from '@/api/jellyfin/jellyfin';
import { resetFakeStores } from '@/test/mocks/tauri-store';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));
vi.mock('@jellyfin/sdk/lib/utils/api/system-api', () => ({ getSystemApi: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/user-api', () => ({ getUserApi: vi.fn() }));

beforeEach(() => {
	resetFakeStores();
});

function fakeSdk(best?: { address: string }) {
	return {
		discovery: {
			getRecommendedServerCandidates: vi.fn().mockResolvedValue([]),
			findBestServer: vi.fn().mockReturnValue(best),
		},
		createApi: vi.fn((basePath: string) => ({ basePath })),
	};
}

describe('createClient', () => {
	it('generates a device id on first launch and reuses it on every later launch', async () => {
		const first = await createClient();
		const second = await createClient();

		expect(first.deviceInfo.id).toEqual(expect.any(String));
		expect(first.deviceInfo.id).not.toBe('');
		expect(second.deviceInfo.id).toBe(first.deviceInfo.id);
	});
});

describe('connectToServer', () => {
	const info = { ServerName: 'Home', Version: '10.10.0' };

	beforeEach(() => {
		vi.mocked(getSystemApi).mockReturnValue({
			getPublicSystemInfo: vi.fn().mockResolvedValue({ data: info }),
		} as never);
	});

	it('connects to the address discovery resolved, not the raw text the user typed', async () => {
		const sdk = fakeSdk({ address: 'http://jellyfin.local:8096' });

		const server = await connectToServer(sdk as unknown as Jellyfin, 'jellyfin.local');

		expect(sdk.discovery.getRecommendedServerCandidates).toHaveBeenCalledWith('jellyfin.local');
		expect(sdk.createApi).toHaveBeenCalledWith('http://jellyfin.local:8096');
		expect(server).toMatchObject({ serverUrl: 'http://jellyfin.local:8096', info });
	});

	it('fails with a readable message when no Jellyfin server answers at that address', async () => {
		const sdk = fakeSdk(undefined);

		await expect(connectToServer(sdk as unknown as Jellyfin, 'not-a-server')).rejects.toThrow(
			'No valid Jellyfin server found at the provided URL.',
		);
		expect(sdk.createApi).not.toHaveBeenCalled();
	});
});

describe('authenticateUser', () => {
	const credentials = { username: 'neo', password: 'red-pill' };
	let api: Api;
	let authenticateUserByName: ReturnType<typeof vi.fn>;

	function respondWith(data: object) {
		authenticateUserByName = vi.fn().mockResolvedValue({ data });
		vi.mocked(getUserApi).mockReturnValue({ authenticateUserByName } as never);
	}

	beforeEach(() => {
		api = { basePath: 'http://jellyfin.local:8096', accessToken: '' } as Api;
	});

	it('sends the typed credentials', async () => {
		respondWith({ AccessToken: 'token', User: { Id: 'user-1', Name: 'neo' } });

		await authenticateUser(api, credentials);

		expect(authenticateUserByName).toHaveBeenCalledWith({
			authenticateUserByName: { Username: 'neo', Pw: 'red-pill' },
		});
	});

	it('returns a session for the server and authenticates the api for later calls', async () => {
		respondWith({
			AccessToken: 'token',
			ServerId: 'server-1',
			User: { Id: 'user-1', Name: 'Neo' },
		});

		const session = await authenticateUser(api, credentials);

		expect(session).toEqual({
			serverUrl: 'http://jellyfin.local:8096',
			serverId: 'server-1',
			userId: 'user-1',
			username: 'Neo',
			accessToken: 'token',
		});
		expect(api.accessToken).toBe('token');
	});

	it('falls back to the typed username and an empty server id when the server omits them', async () => {
		respondWith({ AccessToken: 'token', User: { Id: 'user-1' } });

		const session = await authenticateUser(api, credentials);

		expect(session.username).toBe('neo');
		expect(session.serverId).toBe('');
	});

	it.each([
		['an access token', { User: { Id: 'user-1' } }],
		['a user id', { AccessToken: 'token', User: {} }],
	])('rejects a response without %s and leaves the api unauthenticated', async (_, data) => {
		respondWith(data);

		await expect(authenticateUser(api, credentials)).rejects.toThrow(
			'Authentication succeeded but no access token was returned.',
		);
		expect(api.accessToken).toBe('');
	});
});
