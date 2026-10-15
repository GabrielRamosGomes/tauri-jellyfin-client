import type { ConnectedServer } from '@/api/jellyfin/types';
import type { Api, Jellyfin } from '@jellyfin/sdk';

import { connectToServer, createClient } from '@/api/jellyfin/jellyfin';
import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
import { deferred } from '@/test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/jellyfin');

function makeServer(serverUrl: string): ConnectedServer {
	return { serverUrl, info: { ServerName: serverUrl }, api: { basePath: serverUrl } as Api };
}

const connection = useServerConnection();
const sdk = {} as Jellyfin;

beforeEach(() => {
	connection.reset();
	connection.sdk.value = undefined;
	connection.errorMessage.value = '';
	vi.mocked(createClient).mockResolvedValue(sdk);
});

describe('probe', () => {
	it('validates a server without replacing the live connection', async () => {
		const live = makeServer('http://home:8096');
		const candidate = makeServer('http://work:8096');
		connection.use(live);
		vi.mocked(connectToServer).mockResolvedValue(candidate);

		await expect(connection.probe('work:8096')).resolves.toEqual(candidate);

		expect(connectToServer).toHaveBeenCalledWith(sdk, 'work:8096');
		expect(connection.current.value).toBe(live);
	});

	it('returns null with the error message when the server is unreachable', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(connectToServer).mockRejectedValue(
			new Error('No valid Jellyfin server found at the provided URL.'),
		);

		await expect(connection.probe('nowhere')).resolves.toBeNull();

		expect(connection.errorMessage.value).toBe(
			'No valid Jellyfin server found at the provided URL.',
		);
		expect(connection.loading.value).toBe(false);
	});

	it('falls back to a generic message when the failure is not an Error', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(connectToServer).mockRejectedValue('timeout');

		await connection.probe('nowhere');

		expect(connection.errorMessage.value).toBe('Failed to connect to Jellyfin Server');
	});

	it('clears the previous error when a later probe succeeds', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(connectToServer).mockRejectedValueOnce(new Error('unreachable'));
		await connection.probe('typo');

		vi.mocked(connectToServer).mockResolvedValueOnce(makeServer('http://home:8096'));
		await connection.probe('home:8096');

		expect(connection.errorMessage.value).toBe('');
	});

	it('is loading only while the server is being checked', async () => {
		const response = deferred<ConnectedServer>();
		vi.mocked(connectToServer).mockReturnValue(response.promise);

		const pending = connection.probe('home:8096');
		await vi.waitFor(() => expect(connection.loading.value).toBe(true));

		response.resolve(makeServer('http://home:8096'));
		await pending;
		expect(connection.loading.value).toBe(false);
	});

	it('creates the SDK client once and reuses it for later probes', async () => {
		vi.mocked(connectToServer).mockResolvedValue(makeServer('http://home:8096'));

		await connection.probe('home:8096');
		await connection.probe('work:8096');

		expect(createClient).toHaveBeenCalledTimes(1);
	});
});

describe('connect', () => {
	it('switches the live connection and authenticates it with the saved token', async () => {
		const server = makeServer('http://home:8096');
		vi.mocked(connectToServer).mockResolvedValue(server);

		await connection.connect('http://home:8096', 'saved-token');

		expect(connection.current.value).toEqual(server);
		expect(connection.api.value?.accessToken).toBe('saved-token');
	});

	it('keeps the existing connection when the new server is unreachable', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const live = makeServer('http://home:8096');
		connection.use(live);
		vi.mocked(connectToServer).mockRejectedValue(new Error('unreachable'));

		await expect(connection.connect('http://work:8096', 'token')).resolves.toBeNull();

		expect(connection.current.value).toBe(live);
	});
});

describe('reset', () => {
	it('drops the live connection', () => {
		connection.use(makeServer('http://home:8096'));

		connection.reset();

		expect(connection.api.value).toBeUndefined();
	});
});
