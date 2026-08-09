<template>
	<ul v-if="servers.length" class="server-list">
		<li v-for="server in servers" :key="server.serverUrl">
			<span>{{ server.username }} @ {{ server.serverUrl }}</span>
			<button
				type="button"
				:disabled="loading || server.serverUrl === activeServerUrl"
				@click="emit('switch', server.serverUrl)"
			>
				{{ server.serverUrl === activeServerUrl ? 'Active' : 'Switch' }}
			</button>
			<button type="button" class="link-btn" @click="emit('forget', server.serverUrl)">
				Forget
			</button>
		</li>
	</ul>
</template>

<script setup lang="ts">
	import type { StoredSessionMeta } from '@/api/jellyfin/types';

	defineProps<{
		servers: StoredSessionMeta[];
		activeServerUrl?: string;
		loading: boolean;
	}>();

	const emit = defineEmits<{
		switch: [serverUrl: string];
		forget: [serverUrl: string];
	}>();
</script>
