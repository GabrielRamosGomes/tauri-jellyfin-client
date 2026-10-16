<template>
	<main class="container login-page">
		<ui-icon-button
			v-if="canGoBack"
			class="login-back"
			:icon="ArrowLeft"
			label="Back"
			:size="20"
			@click="goBack" />

		<login-form
			v-if="pendingServer"
			v-model="credentials"
			:server-info="pendingServer.info"
			:loading="loading"
			:error-message="errorMessage"
			@submit="login"
			@use-different-server="addServer" />

		<template v-else>
			<h1>Jellyfin Tauri</h1>
			<p class="server-meta">Choose a server to continue</p>

			<server-list
				:servers="servers"
				:health="health"
				:active-server-url="activeServerUrl"
				:loading="loading"
				@switch="switchTo"
				@forget="forget"
				@add="addDialogOpen = true" />
		</template>

		<add-server-dialog
			v-model:open="addDialogOpen"
			v-model:url="serverUrlInput"
			:loading="connectLoading"
			:error-message="connectError"
			@submit="connect" />
	</main>
</template>

<script setup lang="ts">
	import type { ConnectedServer } from '@/api/jellyfin/types';

	import AddServerDialog from '@/components/features/auth/AddServerDialog.vue';
	import LoginForm from '@/components/features/auth/LoginForm.vue';
	import ServerList from '@/components/features/auth/ServerList.vue';
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
	import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
	import { useServers } from '@/composables/jellyfin/useServers';
	import { useServerStatus } from '@/composables/jellyfin/useServerStatus';
	import { ArrowLeft } from 'lucide-vue-next';
	import { computed, onMounted, ref, shallowRef, watch } from 'vue';
	import { useRoute, useRouter } from 'vue-router';

	const route = useRoute();
	const router = useRouter();

	const {
		api,
		current,
		loading: connectLoading,
		errorMessage: connectError,
		probe,
		use,
		reset,
	} = useServerConnection();

	const {
		session,
		credentials,
		loading: authLoading,
		errorMessage: authError,
		login: authenticate,
		activate,
		clearData,
	} = useAuthSession();

	const { servers, activeServerUrl, refresh: refreshServers, remove: removeServer } = useServers();
	const { health } = useServerStatus(servers);

	const loading = computed(() => connectLoading.value || authLoading.value);
	const errorMessage = computed(() => authError.value || connectError.value);

	const isSignOutMode = computed(() => route.query.mode === 'signout');

	const redirectPath = computed(() => {
		const target = route.query.redirect;
		return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
			? target
			: undefined;
	});

	const pendingServer = shallowRef<ConnectedServer | null>(null);
	const serverUrlInput = ref('');
	const addDialogOpen = ref(false);

	const canGoBack = computed(() => !pendingServer.value && !!api.value && !!session.value);

	watch(addDialogOpen, (open) => {
		if (open) connectError.value = '';
	});

	onMounted(async () => {
		credentials.value = { username: '', password: '' };

		if (isSignOutMode.value && current.value) {
			pendingServer.value = current.value;
			reset();
		}

		await refreshServers();
	});

	function goBack() {
		router.push({ name: 'home' });
	}

	function normalizeUrl(url: string) {
		return url.trim().replace(/\/+$/, '').toLowerCase();
	}

	function findSavedServer(url: string, serverId?: string | null) {
		return servers.value.find(
			(saved) =>
				normalizeUrl(saved.serverUrl) === normalizeUrl(url) ||
				(!!serverId && saved.serverId === serverId),
		);
	}

	async function connect() {
		if (findSavedServer(serverUrlInput.value)) {
			connectError.value = 'This server is already in your list.';
			return;
		}

		const server = await probe(serverUrlInput.value);
		if (!server) return;

		if (findSavedServer(server.serverUrl, server.info.Id)) {
			connectError.value = `${server.info.ServerName ?? 'This server'} is already in your list.`;
			return;
		}

		pendingServer.value = server;
		addDialogOpen.value = false;
	}

	async function login() {
		const server = pendingServer.value;
		if (!server) return;

		const newSession = await authenticate(server.api);
		if (!newSession) return;

		use(server);
		await refreshServers();
		router.push(redirectPath.value ?? { name: 'home' });
	}

	function addServer() {
		pendingServer.value = null;
		credentials.value = { username: '', password: '' };
		authError.value = '';
	}

	async function switchTo(url: string) {
		if (url === activeServerUrl.value) return;

		// Probe first so a failed connection leaves the current session untouched.
		const server = await probe(url);
		if (!server) return;

		const saved = await activate(url);
		if (!saved) return;

		use(server, saved.accessToken);
		router.push({ name: 'home' });
	}

	async function forget(url: string) {
		const wasLive = url === session.value?.serverUrl;
		await removeServer(url);

		if (wasLive) {
			await clearData();
			reset();
		}
	}
</script>
