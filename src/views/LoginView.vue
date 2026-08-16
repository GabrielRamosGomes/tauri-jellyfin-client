<template>
	<main class="container">
		<h1 v-if="!isSignOutMode">Jellyfin Tauri</h1>

		<server-list
			v-if="!isSignOutMode"
			:servers="servers"
			:active-server-url="session?.serverUrl"
			:loading="loading"
			@switch="switchTo"
			@forget="forget"
		/>

		<login-form
			v-if="serverInfo"
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
	import LoginForm from '@/components/features/auth/LoginForm.vue';
	import ServerConnectForm from '@/components/features/auth/ServerConnectForm.vue';
	import ServerList from '@/components/features/auth/ServerList.vue';
	import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
	import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
	import { useServers } from '@/composables/jellyfin/useServers';
	import { computed, onMounted } from 'vue';
	import { useRoute, useRouter } from 'vue-router';

	const route = useRoute();
	const router = useRouter();

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
		clearData,
	} = useAuthSession();

	const { servers, refresh: refreshServers, remove: removeServer } = useServers();

	const loading = computed(() => connectLoading.value || authLoading.value);
	const errorMessage = computed(() => authError.value || connectError.value);

	// Signing out lands here with ?mode=signout: keep the existing server
	// connection so the username/password form shows immediately. Arriving any
	// other way (e.g. "Change Server") always resets to "pick a server" mode.
	const isSignOutMode = computed(() => route.query.mode === 'signout');

	onMounted(async () => {
		await clearData();
		if (!isSignOutMode.value) reset();

		await refreshServers();
	});

	async function connect() {
		await connectToUrl(serverUrl.value);
	}

	async function login() {
		if (!api.value) return;
		await authenticate(api.value);

		if (session.value) {
			await refreshServers();
			router.push({ name: 'home' });
		}
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
		router.push({ name: 'home' });
	}

	async function forget(url: string) {
		await removeServer(url);
		if (session.value?.serverUrl === url) {
			await deactivate();
			reset();
		}
	}
</script>
