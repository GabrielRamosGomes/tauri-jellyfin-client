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
				<input
					v-model="credentials.username"
					type="text"
					placeholder="Username"
					required
					:disabled="loading"
				/>
				<input
					v-model="credentials.password"
					type="password"
					placeholder="Password"
					:disabled="loading"
				/>
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
	import { useAuthSession } from '@/composables/useAuthSession';
	import { useServerConnection } from '@/composables/useServerConnection';
	import { computed, onMounted } from 'vue';

	const {
		api,
		serverUrl,
		serverInfo,
		loading: connectLoading,
		errorMessage: connectError,
		connect: connectToUrl,
		reset,
	} = useServerConnection();

	const {
		session,
		credentials,
		loading: authLoading,
		errorMessage: authError,
		login: authenticate,
		logout: clearSession,
		restoreSession,
	} = useAuthSession();

	const loading = computed(() => connectLoading.value || authLoading.value);
	const errorMessage = computed(() => authError.value || connectError.value);

	onMounted(async () => {
		const saved = await restoreSession();
		if (!saved) return;

		const server = await connectToUrl(saved.serverUrl);
		if (!server) {
			await clearSession();
			return;
		}

		server.api.accessToken = saved.accessToken;
	});

	async function connect() {
		await connectToUrl(serverUrl.value);
	}

	async function login() {
		if (!api.value) return;
		await authenticate(api.value);
	}

	async function logout() {
		await clearSession();
	}

	async function switchServer() {
		await clearSession();
		reset();
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
