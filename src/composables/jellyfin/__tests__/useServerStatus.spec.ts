import type { StoredSessionMeta } from '@/api/jellyfin/types';
import type { Jellyfin } from '@jellyfin/sdk';
import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

import { createClient, pingServer } from '@/api/jellyfin/jellyfin';
import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
import { useServerStatus } from '@/composables/jellyfin/useServerStatus';
import { makeSession } from '@/test/fixtures/jellyfin';
import { deferred, withScope } from '@/test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/jellyfin');

const { accessToken: _, ...home } = makeSession({ serverUrl: 'http://home:8096' });
const { accessToken: __, ...work } = makeSession({ serverUrl: 'http://work:8096' });
const homeInfo = { ServerName: 'Home', Version: '10.10.0' };

function track(list: StoredSessionMeta[]) {
	const servers = ref(list);
	const [{ health }] = withScope(() => useServerStatus(servers));
	return { servers, health };
}

beforeEach(() => {
	vi.useFakeTimers();
	useServerConnection().sdk.value = undefined;
	vi.mocked(createClient).mockResolvedValue({} as Jellyfin);
});

describe('useServerStatus', () => {
	it('shows each server as checking until its first ping answers', async () => {
		const ping = deferred<PublicSystemInfo>();
		vi.mocked(pingServer).mockReturnValue(ping.promise);

		const { health } = track([home]);
		expect(health.value[home.serverUrl].status).toBe('checking');

		ping.resolve(homeInfo);
		await vi.waitFor(() => expect(health.value[home.serverUrl].status).toBe('online'));
	});

	it("reports a reachable server as online with the server's name and version", async () => {
		vi.mocked(pingServer).mockResolvedValue(homeInfo);

		const { health } = track([home]);

		await vi.waitFor(() =>
			expect(health.value[home.serverUrl]).toEqual({
				status: 'online',
				name: 'Home',
				version: '10.10.0',
			}),
		);
	});

	it('reports a server that does not answer as offline', async () => {
		vi.mocked(pingServer).mockRejectedValue(new Error('timeout'));

		const { health } = track([home]);

		await vi.waitFor(() => expect(health.value[home.serverUrl].status).toBe('offline'));
	});

	it('rechecks in the background without flashing back to "checking"', async () => {
		vi.mocked(pingServer).mockResolvedValue(homeInfo);
		const { health } = track([home]);
		await vi.waitFor(() => expect(health.value[home.serverUrl].status).toBe('online'));

		const recheck = deferred<PublicSystemInfo>();
		vi.mocked(pingServer).mockReturnValue(recheck.promise);
		await vi.advanceTimersByTimeAsync(30_000);

		expect(pingServer).toHaveBeenCalledTimes(2);
		expect(health.value[home.serverUrl].status).toBe('online');

		recheck.reject(new Error('timeout'));
		await vi.waitFor(() => expect(health.value[home.serverUrl].status).toBe('offline'));
	});

	it("keeps showing a server's last known name while it is offline", async () => {
		vi.mocked(pingServer).mockResolvedValueOnce(homeInfo);
		const { health } = track([home]);
		await vi.waitFor(() => expect(health.value[home.serverUrl].status).toBe('online'));

		vi.mocked(pingServer).mockRejectedValue(new Error('timeout'));
		await vi.advanceTimersByTimeAsync(30_000);

		await vi.waitFor(() =>
			expect(health.value[home.serverUrl]).toEqual({
				status: 'offline',
				name: 'Home',
				version: '10.10.0',
			}),
		);
	});

	it('checks newly added servers right away without re-pinging known ones', async () => {
		vi.mocked(pingServer).mockResolvedValue(homeInfo);
		const { servers, health } = track([home]);
		await vi.waitFor(() => expect(health.value[home.serverUrl].status).toBe('online'));

		servers.value = [home, work];

		await vi.waitFor(() => expect(health.value[work.serverUrl]?.status).toBe('online'));
		expect(vi.mocked(pingServer).mock.calls.map(([, url]) => url)).toEqual([
			home.serverUrl,
			work.serverUrl,
		]);
	});

	it('stops rechecking once the screen is gone', async () => {
		vi.mocked(pingServer).mockResolvedValue(homeInfo);
		const servers = ref([home]);
		const [, scope] = withScope(() => useServerStatus(servers));
		await vi.advanceTimersByTimeAsync(0);

		scope.stop();
		await vi.advanceTimersByTimeAsync(90_000);

		expect(pingServer).toHaveBeenCalledTimes(1);
	});
});
