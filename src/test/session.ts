import type { Api } from '@jellyfin/sdk';

import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
import { useServerConnection } from '@/composables/jellyfin/useServerConnection';

import { makeSession } from './fixtures/jellyfin';

// Seeds the real connection/session singletons the way the router guard leaves them after restoring.
export function signIn(session = makeSession()) {
	const api = { basePath: session.serverUrl, accessToken: session.accessToken } as Api;
	useServerConnection().use({ serverUrl: session.serverUrl, info: {}, api });
	useAuthSession().session.value = session;
	return { api, session };
}

export function signOut() {
	useServerConnection().reset();
	useAuthSession().clearData();
}
