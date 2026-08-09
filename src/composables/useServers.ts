import type { StoredSessionMeta } from '@/api/jellyfin/types';

import { authStorage } from '@/api/storage/auth';
import { ref } from 'vue';

const servers = ref<StoredSessionMeta[]>([]);

async function refresh() {
	servers.value = await authStorage.listSessions();
}

async function remove(serverUrl: string) {
	await authStorage.clearSession(serverUrl);
	await refresh();
}

export function useServers() {
	return { servers, refresh, remove };
}
