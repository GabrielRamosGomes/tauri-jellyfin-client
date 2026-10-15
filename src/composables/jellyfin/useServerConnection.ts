import type { ConnectedServer } from '@/api/jellyfin/types';
import type { Jellyfin } from '@jellyfin/sdk';

import { connectToServer, createClient } from '@/api/jellyfin/jellyfin';
import { computed, ref, shallowRef } from 'vue';

const loading = ref(false);
const errorMessage = ref('');

const sdk = shallowRef<Jellyfin>();
const current = shallowRef<ConnectedServer>();
const api = computed(() => current.value?.api);

async function ensureSdk() {
	if (!sdk.value) sdk.value = await createClient();

	return sdk.value;
}

// Validates a server without touching the live connection, so the app keeps working
// while the user is only trying out another server.
async function probe(url: string) {
	loading.value = true;
	errorMessage.value = '';

	try {
		return await connectToServer(await ensureSdk(), url);
	} catch (error) {
		errorMessage.value =
			error instanceof Error ? error.message : 'Failed to connect to Jellyfin Server';

		console.error('Error connecting to Jellyfin server: ', errorMessage.value);

		return null;
	} finally {
		loading.value = false;
	}
}

function use(server: ConnectedServer, accessToken?: string) {
	if (accessToken) server.api.accessToken = accessToken;
	current.value = server;
}

async function connect(url: string, accessToken?: string) {
	const server = await probe(url);
	if (server) use(server, accessToken);

	return server;
}

function reset() {
	current.value = undefined;
}

export function useServerConnection() {
	return {
		sdk,
		api,
		current,
		loading,
		errorMessage,
		probe,
		use,
		connect,
		reset,
		getSdk: ensureSdk,
	};
}
