<template>
	<div class="app-shell">
		<app-sidebar />
		<main class="app-content">
			<router-view />
		</main>
	</div>
</template>

<script setup lang="ts">
	import AppSidebar from '@/components/layout/AppSidebar.vue';
</script>
