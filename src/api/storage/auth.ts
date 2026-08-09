import { AuthenticatedSession, Sessions, StoredSessionMeta } from '@/api/jellyfin/types';
import { LazyStore } from '@tauri-apps/plugin-store';

import { keychain } from './keychain';

const store = new LazyStore('settings.json');

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

	async getSession(serverUrl: string): Promise<AuthenticatedSession | null> {
		const sessions = await getSessions();
		const metadata = sessions?.[serverUrl];
		if (!metadata) return null;

		const accessToken = await keychain.get(serverUrl);
		if (!accessToken) return null;

		return { ...metadata, accessToken };
	},

	async clearSession(serverUrl: string) {
		const sessions = (await getSessions()) ?? {};
		delete sessions[serverUrl];
		await store.set(KEYS.SESSIONS, sessions);

		const activeServer = await this.getActiveServerUrl();
		if (activeServer === serverUrl) await store.delete(KEYS.ACTIVE_SERVER);
		await store.save();

		await keychain.delete(serverUrl);
	},

	async listSessions(): Promise<StoredSessionMeta[]> {
		const sessions = await getSessions();

		return Object.values(sessions ?? {});
	},

	async getActiveServerUrl(): Promise<string | null> {
		const activeServer = await store.get<string>(KEYS.ACTIVE_SERVER);

		return activeServer ?? null;
	},

	async clearActiveServerUrl() {
		await store.delete(KEYS.ACTIVE_SERVER);
		await store.save();
	},

	async setActiveServerUrl(serverUrl: string) {
		await store.set(KEYS.ACTIVE_SERVER, serverUrl);
		await store.save();
	},

	async loadActiveSession(): Promise<AuthenticatedSession | null> {
		const activeServer = await this.getActiveServerUrl();
		return activeServer ? this.getSession(activeServer) : null;
	},

	async getDeviceId() {
		return (await store.get<string>(KEYS.DEVICE_ID)) ?? null;
	},

	async setDeviceId(id: string) {
		await store.set(KEYS.DEVICE_ID, id);
		await store.save();
	},
};
