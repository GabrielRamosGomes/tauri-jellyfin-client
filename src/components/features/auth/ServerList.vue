<template>
	<ul class="server-list">
		<li
			v-for="server in orderedServers"
			:key="server.serverUrl">
			<server-card
				:server="server"
				:health="health[server.serverUrl]"
				:active="server.serverUrl === activeServerUrl"
				:loading="loading"
				@connect="emit('switch', server.serverUrl)"
				@forget="emit('forget', server.serverUrl)" />
		</li>
		<li>
			<button
				type="button"
				class="server-add-card"
				:disabled="loading"
				@click="emit('add')">
				<span class="server-add-card-icon">
					<plus
						:size="28"
						aria-hidden="true" />
				</span>
				<span class="server-add-card-title">Add Server</span>
				<span class="server-meta">Connect to a new Jellyfin server</span>
			</button>
		</li>
	</ul>
</template>

<script setup lang="ts">
	import type { StoredSessionMeta } from '@/api/jellyfin/types';
	import type { ServerHealth } from '@/composables/jellyfin/useServerStatus';

	import ServerCard from '@/components/features/auth/ServerCard.vue';
	import { Plus } from 'lucide-vue-next';
	import { computed } from 'vue';

	const props = defineProps<{
		servers: StoredSessionMeta[];
		health: Record<string, ServerHealth>;
		activeServerUrl?: string | null;
		loading: boolean;
	}>();

	const emit = defineEmits<{
		switch: [serverUrl: string];
		forget: [serverUrl: string];
		add: [];
	}>();

	const orderedServers = computed(() => {
		const isActive = (server: StoredSessionMeta) => server.serverUrl === props.activeServerUrl;
		return [...props.servers.filter(isActive), ...props.servers.filter((s) => !isActive(s))];
	});
</script>
