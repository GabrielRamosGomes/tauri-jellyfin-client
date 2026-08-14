<template>
	<div class="media-item-card">
		<div class="media-item-media">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="item.Name ?? ''"
				@error="imageFailed = true"
			/>
			<span v-else class="media-item-title">{{ item.Name }}</span>

			<span v-if="item.UserData?.Played" class="media-item-badge media-item-badge-done">✓</span>
			<span v-else-if="unwatchedCount" class="media-item-badge">{{ unwatchedCount }}</span>
		</div>
		<p class="media-item-name">{{ item.Name }}</p>
		<p v-if="item.ProductionYear" class="media-item-year">{{ item.ProductionYear }}</p>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { getLibraryImageUrl } from '@/api/jellyfin/library';
	import { useServerConnection } from '@/composables/useServerConnection';
	import { computed, ref } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { api } = useServerConnection();

	const imageFailed = ref(false);

	const imageUrl = computed(() =>
		api.value ? getLibraryImageUrl(api.value, props.item) : undefined,
	);

	const unwatchedCount = computed(() => props.item.UserData?.UnplayedItemCount);
</script>
