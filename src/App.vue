<template>
  <main class="container">
    <h1>Jellyfin Tauri</h1>

    <!-- Authenticated -->
    <div v-if="session" class="server-card">
      <p class="status-badge">Connected</p>
      <h2>{{ serverInfo?.ServerName }}</h2>
      <p class="server-meta">Signed in as {{ session.username }}</p>
      <div class="row">
        <button type="button" @click="logout">Log out</button>
        <button type="button" @click="switchServer">Switch server</button>
      </div>
    </div>

    <!-- Connected to server, needs login -->
    <form v-else-if="serverInfo" class="server-form" @submit.prevent="login">
      <p class="server-meta">{{ serverInfo.ServerName }} ({{ serverInfo.Version }})</p>
      <div class="row">
        <input v-model="username" type="text" placeholder="Username" required :disabled="loading" />
        <input v-model="password" type="password" placeholder="Password" :disabled="loading" />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </div>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      <button type="button" class="link-btn" @click="switchServer">Use a different server</button>
    </form>

    <!-- No server connected -->
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
import type { Api, Jellyfin } from '@jellyfin/sdk';
import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

import { authenticateUser, connectToServer, createClient } from '@/api/jellyfin/jellyfin';
import { AuthenticatedSession, JellyfinUser } from '@/api/jellyfin/types';
import { authStorage } from '@/api/storage/auth';
import { ref, onMounted } from 'vue';

const serverUrl = ref('');
const username = ref('');
const password = ref('');

const sdk = ref<Jellyfin>();
const api = ref<Api>();
const loading = ref(false);
const errorMessage = ref('');
const serverInfo = ref<PublicSystemInfo | null>(null);
const session = ref<AuthenticatedSession | null>(null);

onMounted(async () => {
  sdk.value = await createClient();

  const saved = await authStorage.loadActiveSession();
  if (!saved) return;

  loading.value = true;
  try {
    const server = await connectToServer(sdk.value, saved.serverUrl);
    server.api.accessToken = saved.accessToken;

    serverUrl.value = server.serverUrl;
    serverInfo.value = server.info;
    api.value = server.api;
    session.value = saved;
  } catch {
    await authStorage.clearSession(saved.serverUrl);
  } finally {
    loading.value = false;
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
    serverUrl.value = server.serverUrl;
    serverInfo.value = server.info;
    api.value = server.api;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to connect to Jellyfin server.';
    console.error('Error connecting to Jellyfin server:', errorMessage.value);
  } finally {
    loading.value = false;
  }
}

async function login() {
  if (!api.value) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const user: JellyfinUser = {
      username: username.value,
      password: password.value,
    };
    const authed = await authenticateUser(api.value, user);
    await authStorage.saveSession(authed);
    session.value = authed;
    password.value = '';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed.';
    console.error('Error authenticating with Jellyfin server:', errorMessage.value);
  } finally {
    loading.value = false;
  }
}

async function logout() {
  if (session.value) {
    await authStorage.clearSession(session.value.serverUrl);
  }
  session.value = null;
  username.value = '';
  password.value = '';
}

async function switchServer() {
  if (session.value) {
    await authStorage.clearSession(session.value.serverUrl);
  }
  session.value = null;
  serverInfo.value = null;
  api.value = undefined;
  serverUrl.value = '';
  username.value = '';
  password.value = '';
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

.link-btn {
  margin-top: 8px;
  background: none;
  border: none;
  box-shadow: none;
  text-decoration: underline;
  padding: 4px;
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
