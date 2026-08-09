<template>
	<aside class="sidebar">
		<div v-if="session" class="sidebar-account">
			<p class="sidebar-account-name">{{ session.username }}</p>
			<p class="sidebar-account-server">{{ serverInfo?.ServerName ?? session.serverUrl }}</p>
		</div>

		<nav class="sidebar-nav">
			<router-link :to="{ name: 'home' }" class="nav-item">Home</router-link>

			<p class="nav-section-label">Media</p>
			<!-- Populated once library views (TODO 2. Fetch library categories) are wired up -->
			<p v-if="!libraries.length" class="nav-empty">No libraries yet</p>

			<p class="nav-section-label">Administration</p>
			<router-link :to="{ name: 'dashboard' }" class="nav-item">Dashboard</router-link>
			<router-link :to="{ name: 'metadata-manager' }" class="nav-item">
				Metadata Manager
			</router-link>

			<p class="nav-section-label">User</p>
			<router-link :to="{ name: 'login' }" class="nav-item">Select Server</router-link>
			<router-link :to="{ name: 'settings' }" class="nav-item">Settings</router-link>
			<button type="button" class="nav-item nav-button" @click="signOut">Sign Out</button>
			<button type="button" class="nav-item nav-button" @click="exitApplication">
				Exit Application
			</button>
		</nav>
	</aside>
</template>

<script setup lang="ts">
	import { useAuthSession } from '@/composables/useAuthSession';
	import { useServerConnection } from '@/composables/useServerConnection';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { useRouter } from 'vue-router';

	const router = useRouter();

	const { session, logout } = useAuthSession();
	const { serverInfo } = useServerConnection();

	const libraries: never[] = [];

	async function signOut() {
		await logout();
		router.push({ name: 'login' });
	}

	async function exitApplication() {
		await getCurrentWindow().close();
	}
</script>
