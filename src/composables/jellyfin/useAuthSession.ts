import type { Api } from '@jellyfin/sdk';

import { authenticateUser } from '@/api/jellyfin/jellyfin';
import { AuthenticatedSession, JellyfinUser } from '@/api/jellyfin/types';
import { authStorage } from '@/api/storage/auth';
import { ref } from 'vue';

const loading = ref(false);
const errorMessage = ref('');

const session = ref<AuthenticatedSession | null>(null);
const credentials = ref<JellyfinUser>({ username: '', password: '' });

async function login(api: Api): Promise<AuthenticatedSession | null> {
	loading.value = true;
	errorMessage.value = '';

	try {
		const userSession = await authenticateUser(api, credentials.value);
		await authStorage.saveSession(userSession);

		session.value = userSession;
		credentials.value.password = ''; // We don't want to keep the password stored as plain text during runtime

		return userSession;
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Login failed.';
		console.error('Error authenticating with Jellyfin server:', errorMessage.value);

		return null;
	} finally {
		loading.value = false;
	}
}

async function activate(serverUrl: string): Promise<AuthenticatedSession | null> {
	const serverSession = await authStorage.getSession(serverUrl);
	if (serverSession) {
		await authStorage.setActiveServerUrl(serverUrl);
		session.value = serverSession;
	}

	return serverSession;
}

async function restoreActive(): Promise<AuthenticatedSession | null> {
	const activeUrl = await authStorage.getActiveServerUrl();

	return activeUrl ? activate(activeUrl) : null;
}

async function restoreSession(): Promise<AuthenticatedSession | null> {
	const saved = await authStorage.loadActiveSession();
	if (saved) session.value = saved;

	return saved;
}

async function logout() {
	await authStorage.clearActiveServerUrl();
	clearData();
}

async function clearData() {
	session.value = null;
	credentials.value = { username: '', password: '' };
}

export function useAuthSession() {
	return {
		session,
		credentials,
		loading,
		errorMessage,
		activate,
		clearData,
		login,
		logout,
		restoreActive,
		restoreSession,
	};
}
