<template>
  <main class="container">
    <h1>Jellyfin Tauri</h1>

    <div v-if="serverInfo" class="server-card">
      <p class="status-badge">Connected</p>
      <h2>{{ serverInfo.ServerName }}</h2>
      <p class="server-meta">Version: {{ serverInfo.Version }}</p>
      <button type="button" @click="disconnect">Disconnect</button>
    </div>

    <form v-else class="server-form" @submit.prevent="connect">
      <div class="row">
        <input
          v-model="serverUrl"
          type="url"
          placeholder="Server URL (e.g. http://192.168.1.5:8096)"
          required
          :disabled="loading"
        />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Testing...' : 'Connect' }}
        </button>
      </div>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
import type { Jellyfin } from '@jellyfin/sdk';

import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';
import { ref, onMounted } from 'vue';

import { connectToServer, createClient } from './api/jellyfin/jellyfin';
import { authStorage } from './api/storage/auth';

const serverUrl = ref('');
const sdk = ref<Jellyfin>();
const loading = ref(false);
const errorMessage = ref('');
const serverInfo = ref<PublicSystemInfo | null>(null);

onMounted(async () => {
  const savedSession = await authStorage.loadSession();
  sdk.value = await createClient();

  if (savedSession?.serverUrl) {
    loading.value = true;
    try {
      const server = await connectToServer(sdk.value, savedSession.serverUrl);
      serverUrl.value = savedSession.serverUrl;
      serverInfo.value = server.info;
    } catch {
      authStorage.clearSession();
    } finally {
      loading.value = false;
    }
  }
});

async function connect() {
  loading.value = true;
  errorMessage.value = '';

  if (!sdk.value) {
    sdk.value = await createClient();
  }

  try {
    const server = await connectToServer(sdk.value, serverUrl.value);
    serverInfo.value = server.info;
    serverUrl.value = server.serverUrl;

    authStorage.saveSession({
      serverUrl: server.serverUrl,
      accessToken: '',
      userId: '',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to connect to Jellyfin server.';

    console.error('Error connecting to Jellyfin server:', message);
    errorMessage.value = message;
  } finally {
    loading.value = false;
  }

  console.log('Connecting to Jellyfin server at:', serverUrl.value);
}

function disconnect() {
  authStorage.clearSession();
  serverInfo.value = null;
  serverUrl.value = '';
}
</script>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.row {
  display: flex;
  justify-content: center;
  gap: 8px;
}

h1 {
  text-align: center;
  margin-bottom: 24px;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
  outline: none;
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}

button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

button:disabled,
input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }

  button:active {
    background-color: #0f0f0f69;
  }
}
</style>
