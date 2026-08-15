<template>
	<div class="app-shell">
		<app-header />
		<app-sidebar />
		<main class="app-content">
			<router-view />
		</main>
	</div>
</template>

<script setup lang="ts">
	import AppHeader from '@/components/layout/AppHeader.vue';
	import AppSidebar from '@/components/layout/AppSidebar.vue';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { useUserProfile } from '@/composables/jellyfin/useUserProfile';
	import { onMounted } from 'vue';

	const { refresh: refreshLibraries } = useLibraries();
	const { refresh: refreshProfile } = useUserProfile();

	onMounted(() => {
		refreshLibraries();
		refreshProfile();
	});
</script>
