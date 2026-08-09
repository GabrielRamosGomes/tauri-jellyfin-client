import type { StoredSessionMeta } from '@/api/jellyfin/types';

import { authStorage } from '@/api/storage/auth';
import { ref } from 'vue';

export function useServers() {
	const servers = ref<StoredSessionMeta[]>([]);

	async function refresh() {
		servers.value = await authStorage.listSessions();
	}

	async function remove(serverUrl: string) {
		await authStorage.clearSession(serverUrl);
		await refresh();
	}

	return { servers, refresh, remove };
}
