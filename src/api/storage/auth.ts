import { AuthenticatedSession } from '@/api/jellyfin/types';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('settings.json');

type Sessions = Record<string, AuthenticatedSession>;

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
    const sessions = (await getSessions()) ?? {};

    sessions[session.serverUrl] = session;
    await store.set(KEYS.SESSIONS, sessions);
    await store.set(KEYS.ACTIVE_SERVER, session.serverUrl);
    await store.save();
  },

  async loadActiveSession(): Promise<AuthenticatedSession | null> {
    const activeServer = await getActiveServer();
    if (!activeServer) return null;

    const sessions = await getSessions();
    return sessions?.[activeServer] ?? null;
  },

  async clearSession(serverUrl: string) {
    const sessions = (await getSessions()) ?? {};
    delete sessions[serverUrl];
    await store.set(KEYS.SESSIONS, sessions);

    const activeServer = await getActiveServer();
    if (activeServer === serverUrl) await store.delete(KEYS.ACTIVE_SERVER);
    await store.save();
  },

  async getDeviceId() {
    return (await store.get<string>(KEYS.DEVICE_ID)) ?? null;
  },

  async setDeviceId(id: string) {
    await store.set(KEYS.DEVICE_ID, id);
    await store.save();
  },
};
