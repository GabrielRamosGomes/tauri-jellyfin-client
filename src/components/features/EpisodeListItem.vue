<template>
	<router-link :to="{ name: 'item', params: { id: item.Id } }" class="episode-list-item">
		<span class="episode-index">{{ item.IndexNumber ?? '–' }}</span>

		<div class="episode-thumb">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="item.Name ?? ''"
				@error="imageFailed = true"
			/>
			<span class="episode-play">▶</span>
			<span
				v-if="item.UserData?.Played"
				class="episode-badge episode-badge-done"
				aria-label="Watched"
			>
				<check :size="12" stroke-width="3" aria-hidden="true" />
			</span>
		</div>

		<div class="episode-info">
			<p class="episode-name">{{ item.Name }}</p>
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

	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { Check } from 'lucide-vue-next';
	import { computed, ref } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { libraryImageUrl } = useMediaImages();

	const imageFailed = ref(false);

	const imageUrl = computed(() => libraryImageUrl(props.item));

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
