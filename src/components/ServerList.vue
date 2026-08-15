<template>
	<ul v-if="servers.length" class="server-list">
		<li v-for="server in servers" :key="server.serverUrl">
			<span>{{ server.username }} @ {{ server.serverUrl }}</span>
			<ui-button
				size="sm"
				:disabled="loading || server.serverUrl === activeServerUrl"
				@click="emit('switch', server.serverUrl)"
			>
				{{ server.serverUrl === activeServerUrl ? 'Active' : 'Switch' }}
			</ui-button>
			<ui-button variant="ghost" size="sm" @click="emit('forget', server.serverUrl)">
				Forget
			</ui-button>
		</li>
	</ul>
</template>

<script setup lang="ts">
	import type { StoredSessionMeta } from '@/api/jellyfin/types';

	import UiButton from '@/components/ui/UiButton.vue';

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
