<template>
	<div class="server-card">
		<p class="status-badge">Connected</p>
		<h2>{{ serverInfo?.ServerName }}</h2>
		<p class="server-meta">Signed in as {{ session.username }}</p>
		<div class="row">
			<button type="button" @click="emit('logout')">Log out</button>
			<button type="button" @click="emit('addServer')">Add server</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { AuthenticatedSession } from '@/api/jellyfin/types';
	import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

	defineProps<{
		serverInfo: PublicSystemInfo | null;
		session: AuthenticatedSession;
	}>();

	const emit = defineEmits<{
		logout: [];
		addServer: [];
	}>();
</script>
