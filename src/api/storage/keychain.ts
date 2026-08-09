import { invoke } from '@tauri-apps/api/core';

export const keychain = {
  async set(account: string, value: string) {
    await invoke('secure_set', { account, value });
  },

  async get(account: string) {
    return await invoke<string | null>('secure_get', { account });
  },

  async delete(account: string) {
    await invoke('secure_delete', { account });
  },
};
