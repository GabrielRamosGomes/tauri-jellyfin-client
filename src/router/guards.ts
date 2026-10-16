import type { RouteLocationNormalized } from 'vue-router';

import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
import { useServerConnection } from '@/composables/jellyfin/useServerConnection';

// Restores the saved session and live connection on first entry into a
// protected route. Runs once per app launch: once `session`/`api` are set
// (both singleton composables), later navigations skip straight through.
export async function restoreSession(to: RouteLocationNormalized) {
	if (to.meta.requiresAuth === false) return;

	const { api, connect } = useServerConnection();
	const { session, restoreActive, logout } = useAuthSession();

	if (api.value && session.value) return;

	const saved = await restoreActive();
	if (!saved) return { name: 'login', query: { redirect: to.fullPath } };

	const server = await connect(saved.serverUrl, saved.accessToken);
	if (!server) {
		await logout();
		return { name: 'login', query: { redirect: to.fullPath } };
	}
}
