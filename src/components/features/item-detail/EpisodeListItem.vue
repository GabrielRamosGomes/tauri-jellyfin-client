<template>
	<router-link :to="{ name: 'item', params: { id: item.Id } }" class="episode-card">
		<div class="episode-thumb">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="item.Name ?? ''"
				loading="lazy"
				@error="imageFailed = true"
			/>

			<div class="episode-play">
				<play :size="20" fill="currentColor" />
			</div>

			<div v-if="progress" class="episode-progress">
				<div class="episode-progress-bar" :style="{ width: `${progress}%` }" />
			</div>

			<div class="episode-actions">
				<ui-icon-button
					:icon="Heart"
					:size="16"
					:label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
					:disabled="pending"
					class="episode-action"
					:class="{ 'ui-icon-btn--favorite': isFavorite }"
					@click.stop.prevent="toggleFavorite"
				/>
				<ui-icon-button
					:icon="Check"
					:size="16"
					:label="isWatched ? 'Mark as unwatched' : 'Mark as watched'"
					:disabled="pending"
					class="episode-action"
					:class="{ 'ui-icon-btn--watched': isWatched }"
					@click.stop.prevent="toggleWatched"
				/>
			</div>
		</div>

		<div class="episode-info">
			<p class="episode-name">
				{{ item.IndexNumber != null ? `${item.IndexNumber}. ` : '' }}{{ item.Name }}
			</p>
			<div class="episode-meta">
				<span v-if="premiereDate">{{ premiereDate }}</span>
				<span v-if="runtimeMinutes">{{ runtimeMinutes }}m</span>
			</div>
			<p v-if="item.Overview" class="episode-overview">{{ item.Overview }}</p>
		</div>
	</router-link>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useItemActions } from '@/composables/jellyfin/useItemActions';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { Check, Heart, Play } from 'lucide-vue-next';
	import { computed, ref, toRef } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { landscapeImageUrl } = useMediaImages();

	const { pending, toggleFavorite, toggleWatched } = useItemActions(toRef(props, 'item'));

	const isFavorite = computed(() => props.item.UserData?.IsFavorite ?? false);
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
