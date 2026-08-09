import type { Api, Jellyfin } from '@jellyfin/sdk';
import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

import { connectToServer, createClient } from '@/api/jellyfin/jellyfin';
import { ref, shallowRef } from 'vue';

export function useServerConnection() {
	const loading = ref(false);
	const errorMessage = ref('');

	const sdk = shallowRef<Jellyfin>();
	const api = shallowRef<Api>();

	const serverUrl = ref('');
	const serverInfo = ref<PublicSystemInfo | null>(null);

	async function ensureSdk() {
		if (!sdk.value) sdk.value = await createClient();

		return sdk.value;
	}

	async function connect(url: string) {
		loading.value = true;
		errorMessage.value = '';

		try {
			const client = await ensureSdk();
			const server = await connectToServer(client, url);

			serverUrl.value = server.serverUrl;
			serverInfo.value = server.info;
			api.value = server.api;

			return server;
		} catch (error) {
			errorMessage.value =
				error instanceof Error ? error.message : 'Failed to connect to Jellyfin Server';

			console.error('Error connecting to Jellyfin server: ', errorMessage.value);

			return null;
		} finally {
			loading.value = false;
		}
	}

	function reset() {
		serverUrl.value = '';
		serverInfo.value = null;
		api.value = undefined;
	}

	return { sdk, api, serverUrl, serverInfo, loading, errorMessage, connect, reset };
}
