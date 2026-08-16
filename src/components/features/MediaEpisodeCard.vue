<template>
	<router-link :to="{ name: 'item', params: { id: item.Id } }" class="media-episode-card">
		<div class="media-episode-media">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="item.Name ?? ''"
				@error="imageFailed = true"
			/>
			<span v-else class="media-episode-fallback">{{ item.Name }}</span>

			<div v-if="progress" class="media-episode-progress">
				<div class="media-episode-progress-bar" :style="{ width: `${progress}%` }" />
			</div>

			<span
				v-if="item.UserData?.Played"
				class="media-item-badge media-item-badge-done"
				aria-label="Watched"
			>
				<check :size="14" stroke-width="3" aria-hidden="true" />
			</span>

			<div class="media-item-play">
				<play :size="20" fill="currentColor" />
			</div>
		</div>

		<p class="media-episode-title">{{ primaryTitle }}</p>
		<p v-if="secondaryText" class="media-episode-subtitle">{{ secondaryText }}</p>
	</router-link>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { Check, Play } from 'lucide-vue-next';
	import { computed, ref } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { landscapeImageUrl } = useMediaImages();

	const imageFailed = ref(false);

	const imageUrl = computed(() => landscapeImageUrl(props.item));

	const isEpisode = computed(() => props.item.Type === 'Episode');

	const primaryTitle = computed(() =>
		isEpisode.value ? (props.item.SeriesName ?? props.item.Name) : props.item.Name,
	);

	const secondaryText = computed(() => {
		if (!isEpisode.value) {
			return props.item.ProductionYear ? String(props.item.ProductionYear) : '';
		}

		const season = props.item.ParentIndexNumber;
		const episode = props.item.IndexNumber;
		const label = season != null && episode != null ? `S${season}:E${episode}` : '';

		return [label, props.item.Name].filter(Boolean).join(' · ');
	});

	const progress = computed(() => props.item.UserData?.PlayedPercentage);
</script>
