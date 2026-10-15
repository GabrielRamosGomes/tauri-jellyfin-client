<template>
	<ui-card
		class="server-card"
		:class="{ 'server-card--active': active }"
		:padded="false">
		<div class="server-card-banner">
			<span class="server-card-icon">
				<server
					:size="28"
					aria-hidden="true" />
			</span>
			<span class="server-card-status">
				<span
					class="server-status-dot"
					:class="`server-status-dot--${status}`"
					aria-hidden="true" />
				{{ STATUS_LABELS[status] }}
			</span>
		</div>

		<div class="server-card-body">
			<p class="server-card-name">{{ name }}</p>
			<p class="server-card-url">{{ server.serverUrl }}</p>
			<p class="server-card-user">
				<user
					:size="14"
					aria-hidden="true" />
				{{ server.username }}
			</p>
		</div>

		<div class="server-card-footer">
			<ui-icon-button
				:icon="Trash2"
				label="Forget server"
				:size="16"
				:disabled="loading"
				@click="emit('forget')" />
			<span
				v-if="active"
				class="server-card-connected">
				<check
					:size="16"
					aria-hidden="true" />
				Connected
			</span>
			<ui-button
				v-else
				size="sm"
				:disabled="loading || status === 'offline'"
				@click="emit('connect')">
				Connect
			</ui-button>
		</div>
	</ui-card>
</template>

<script setup lang="ts">
	import type { StoredSessionMeta } from '@/api/jellyfin/types';
	import type { ServerHealth, ServerStatus } from '@/composables/jellyfin/useServerStatus';

	import UiButton from '@/components/ui/UiButton.vue';
	import UiCard from '@/components/ui/UiCard.vue';
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { Check, Server, Trash2, User } from 'lucide-vue-next';
	import { computed } from 'vue';

	const props = defineProps<{
		server: StoredSessionMeta;
		health?: ServerHealth;
		active: boolean;
		loading: boolean;
	}>();

	const emit = defineEmits<{ connect: []; forget: [] }>();

	const STATUS_LABELS: Record<ServerStatus, string> = {
		checking: 'Checking',
		online: 'Online',
		offline: 'Offline',
	};

	const status = computed(() => props.health?.status ?? 'checking');

	const name = computed(() => {
		if (props.health?.name) return props.health.name;
		try {
			return new URL(props.server.serverUrl).host;
		} catch {
			return props.server.serverUrl;
		}
	});
</script>
