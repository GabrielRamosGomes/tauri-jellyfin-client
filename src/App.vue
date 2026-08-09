<template>
	<main class="container">
		<h1>Jellyfin Tauri</h1>

		<server-list
			:servers="servers"
			:active-server-url="session?.serverUrl"
			:loading="loading"
			@switch="switchTo"
			@forget="forget"
		/>

		<connected-server-card
			v-if="session"
			:server-info="serverInfo"
			:session="session"
			@logout="logout"
			@add-server="addServer"
		/>

		<login-form
			v-else-if="serverInfo"
			v-model="credentials"
			:server-info="serverInfo"
			:loading="loading"
			:error-message="errorMessage"
			@submit="login"
			@use-different-server="addServer"
		/>

		<server-connect-form
			v-else
			v-model="serverUrl"
			:loading="loading"
			:error-message="errorMessage"
			@submit="connect"
		/>
	</main>
</template>

<script setup lang="ts">
	import ConnectedServerCard from '@/components/ConnectedServerCard.vue';
	import LoginForm from '@/components/LoginForm.vue';
	import ServerConnectForm from '@/components/ServerConnectForm.vue';
	import ServerList from '@/components/ServerList.vue';
	import { useAuthSession } from '@/composables/useAuthSession';
	import { useServerConnection } from '@/composables/useServerConnection';
	import { useServers } from '@/composables/useServers';
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
		logout: deactivate,
		activate,
		restoreActive,
		clearData,
	} = useAuthSession();

	const { servers, refresh: refreshServers, remove: removeServer } = useServers();

	const loading = computed(() => connectLoading.value || authLoading.value);
	const errorMessage = computed(() => authError.value || connectError.value);

	onMounted(async () => {
		await refreshServers();

		const saved = await restoreActive();
		if (!saved) return;

		const server = await connectToUrl(saved.serverUrl);
		if (!server) {
			await deactivate();
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
		await refreshServers();
	}

	async function logout() {
		await deactivate();
		reset();
	}

	function addServer() {
		clearData();
		reset();
	}

	async function switchTo(url: string) {
		const full = await activate(url);
		if (!full) return;

		const server = await connectToUrl(full.serverUrl);
		if (!server) return;

		server.api.accessToken = full.accessToken;
	}

	async function forget(url: string) {
		await removeServer(url);
		if (session.value?.serverUrl === url) await logout();
	}
</script>
