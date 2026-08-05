import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('settings.json');

const KEYS = {
  SERVER_URL: 'jf_server_url',
  ACCESS_TOKEN: 'jf_access_token',
  USER_ID: 'jf_user_id',
  DEVICE_ID: 'jf_device_id',
} as const;

export interface StoredSession {
  serverUrl: string;
  accessToken: string;
  userId: string;
}

export const authStorage = {
  async saveSession(session: StoredSession) {
    await store.set(KEYS.SERVER_URL, session.serverUrl);
    await store.set(KEYS.ACCESS_TOKEN, session.accessToken);
    await store.set(KEYS.USER_ID, session.userId);
    await store.save(); // Flushes changes to disk immediately
  },

  async loadSession() {
    const serverUrl = await store.get<string>(KEYS.SERVER_URL);
    const accessToken = await store.get<string>(KEYS.ACCESS_TOKEN);
    const userId = await store.get<string>(KEYS.USER_ID);

    return serverUrl
      ? { serverUrl, accessToken: accessToken ?? '', userId: userId ?? '' }
      : null;
  },

  async clearSession() {
    await store.delete(KEYS.SERVER_URL);
    await store.delete(KEYS.ACCESS_TOKEN);
    await store.delete(KEYS.USER_ID);
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