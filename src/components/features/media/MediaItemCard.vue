<template>
	<router-link :to="{ name: 'item', params: { id: item.Id } }" class="media-item-card">
		<div class="media-item-media">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="item.Name ?? ''"
				width="400"
				height="600"
				loading="lazy"
				decoding="async"
				@error="imageFailed = true"
			/>
			<span v-else class="media-item-title">{{ item.Name }}</span>

			<span
				v-if="item.UserData?.Played"
				class="media-item-badge media-item-badge-done"
				aria-label="Watched"
			>
				<check :size="14" stroke-width="3" aria-hidden="true" />
			</span>
			<span v-else-if="unwatchedCount" class="media-item-badge">{{ unwatchedCount }}</span>

			<div class="media-item-play">
				<play :size="20" fill="currentColor" />
			</div>
		</div>
		<p class="media-item-name">{{ item.Name }}</p>
		<p v-if="item.ProductionYear" class="media-item-year">{{ item.ProductionYear }}</p>
	</router-link>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { Check, Play } from 'lucide-vue-next';
	import { computed, ref } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { libraryImageUrl } = useMediaImages();

	const imageFailed = ref(false);

	const imageUrl = computed(() => libraryImageUrl(props.item));

	const unwatchedCount = computed(() => props.item.UserData?.UnplayedItemCount);
</script>
