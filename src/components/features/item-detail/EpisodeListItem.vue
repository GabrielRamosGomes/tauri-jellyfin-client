<template>
	<router-link
		:to="{ name: 'item', params: { id: item.Id } }"
		class="episode-card"
		:class="{ 'episode-card--watched': isWatched }">
		<ui-aspect-ratio
			:ratio="16 / 9"
			class="episode-thumb">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="item.Name ?? ''"
				loading="lazy"
				@error="imageFailed = true" />

			<div class="episode-play">
				<play
					:size="20"
					fill="currentColor" />
			</div>

			<ui-progress
				v-if="progress"
				:value="progress"
				class="episode-progress" />

			<div class="episode-actions">
				<item-actions
					:item="item"
					:size="16" />
			</div>
		</ui-aspect-ratio>

		<div class="episode-info">
			<p class="episode-name">
				{{ item.IndexNumber != null ? `${item.IndexNumber}. ` : '' }}{{ item.Name }}
			</p>
			<div class="episode-meta">
				<span v-if="premiereDate">{{ premiereDate }}</span>
				<span v-if="runtimeMinutes">{{ runtimeMinutes }}m</span>
			</div>
			<p
				v-if="item.Overview"
				class="episode-overview">
				{{ item.Overview }}
			</p>
		</div>
	</router-link>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import ItemActions from '@/components/features/media/ItemActions.vue';
	import UiAspectRatio from '@/components/ui/UiAspectRatio.vue';
	import UiProgress from '@/components/ui/UiProgress.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { Play } from 'lucide-vue-next';
	import { computed, ref } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { landscapeImageUrl } = useMediaImages();

	const isWatched = computed(() => props.item.UserData?.Played ?? false);

	const imageFailed = ref(false);

	const imageUrl = computed(() => landscapeImageUrl(props.item));

	const progress = computed(() => props.item.UserData?.PlayedPercentage);

	const runtimeMinutes = computed(() =>
		props.item.RunTimeTicks ? Math.round(props.item.RunTimeTicks / 600_000_000) : undefined,
	);

	const premiereDate = computed(() =>
		props.item.PremiereDate
			? new Date(props.item.PremiereDate).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				})
			: undefined,
	);
</script>
