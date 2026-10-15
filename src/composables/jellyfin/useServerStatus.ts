import type { StoredSessionMeta } from '@/api/jellyfin/types';

import { pingServer } from '@/api/jellyfin/jellyfin';
import { useIntervalFn } from '@vueuse/core';
import { ref, watch, type Ref } from 'vue';

import { useServerConnection } from './useServerConnection';

export type ServerStatus = 'checking' | 'online' | 'offline';

export interface ServerHealth {
	status: ServerStatus;
	name?: string;
	version?: string;
}

const RECHECK_INTERVAL_MS = 30_000;

export function useServerStatus(servers: Ref<StoredSessionMeta[]>) {
	const { getSdk } = useServerConnection();
	const health = ref<Record<string, ServerHealth>>({});

	// Background rechecks keep the last known status instead of flashing back to "checking".
	async function check(serverUrl: string, background = false) {
		if (!background) health.value[serverUrl] = { ...health.value[serverUrl], status: 'checking' };

		try {
			const info = await pingServer(await getSdk(), serverUrl);
			health.value[serverUrl] = {
				status: 'online',
				name: info.ServerName ?? undefined,
				version: info.Version ?? undefined,
			};
		} catch {
			health.value[serverUrl] = { ...health.value[serverUrl], status: 'offline' };
		}
	}

	watch(
		servers,
		(list) => {
			for (const server of list) {
				if (!health.value[server.serverUrl]) check(server.serverUrl);
			}
		},
		{ immediate: true },
	);

	useIntervalFn(() => {
		for (const server of servers.value) check(server.serverUrl, true);
	}, RECHECK_INTERVAL_MS);

	return { health };
}
