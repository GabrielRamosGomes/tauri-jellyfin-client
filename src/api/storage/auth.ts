import { AuthenticatedSession } from '@/api/jellyfin/types';
import { LazyStore } from '@tauri-apps/plugin-store';

import { keychain } from './keychain';

const store = new LazyStore('settings.json');

type Sessions = Record<string, StoredSessionMeta>;
type StoredSessionMeta = Omit<AuthenticatedSession, 'accessToken'>;

const KEYS = {
	SESSIONS: 'jf_sessions', // uses Sessions type from above
	ACTIVE_SERVER: 'jf_active_server',
	DEVICE_ID: 'jf_device_id',
} as const;

async function getSessions(): Promise<Sessions | null> {
	const sessions = await store.get<Sessions>(KEYS.SESSIONS);
	if (!sessions) return null;

	return sessions;
}

async function getActiveServer() {
	const activeServer = await store.get<string>(KEYS.ACTIVE_SERVER);

	return activeServer;
}

export const authStorage = {
	async saveSession(session: AuthenticatedSession) {
		const { accessToken, ...metadata } = session;
		const sessions = (await getSessions()) ?? {};

		sessions[session.serverUrl] = metadata;
		await store.set(KEYS.SESSIONS, sessions);
		await store.set(KEYS.ACTIVE_SERVER, session.serverUrl);
		await store.save();

		await keychain.set(session.serverUrl, accessToken);
	},

	async loadActiveSession(): Promise<AuthenticatedSession | null> {
		const activeServer = await getActiveServer();
		if (!activeServer) return null;

		const sessions = await getSessions();
		const metadata = sessions?.[activeServer];
		if (!metadata) return null;

		const accessToken = await keychain.get(activeServer);
		if (!accessToken) return null;

		return { ...metadata, accessToken };
	},

	async clearSession(serverUrl: string) {
		const sessions = (await getSessions()) ?? {};
		delete sessions[serverUrl];
		await store.set(KEYS.SESSIONS, sessions);

		const activeServer = await getActiveServer();
		if (activeServer === serverUrl) await store.delete(KEYS.ACTIVE_SERVER);
		await store.save();

		await keychain.delete(serverUrl);
	},

	async getDeviceId() {
		return (await store.get<string>(KEYS.DEVICE_ID)) ?? null;
	},

	async setDeviceId(id: string) {
		await store.set(KEYS.DEVICE_ID, id);
		await store.save();
	},
};
