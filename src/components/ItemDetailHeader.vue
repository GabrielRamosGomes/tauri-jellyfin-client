<template>
	<div class="item-detail-header" :style="backdropStyle">
		<div class="item-detail-header-overlay">
			<div class="item-detail-poster">
				<img v-if="posterUrl" :src="posterUrl" :alt="item.Name ?? ''" />
			</div>

			<div class="item-detail-info">
				<h1 class="item-detail-title">{{ item.Name }}</h1>

				<div class="item-detail-meta">
					<span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
					<span v-if="item.OfficialRating">{{ item.OfficialRating }}</span>
					<span v-if="runtimeMinutes">{{ runtimeMinutes }} min</span>
				</div>

				<p v-if="genres" class="item-detail-genres">{{ genres }}</p>
				<p v-if="item.Overview" class="item-detail-overview">{{ item.Overview }}</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { getBackdropUrl, getLibraryImageUrl } from '@/api/jellyfin/library';
	import { useServerConnection } from '@/composables/useServerConnection';
	import { computed } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { api } = useServerConnection();

	const backdropUrl = computed(() =>
		api.value ? getBackdropUrl(api.value, props.item) : undefined,
	);
	const posterUrl = computed(() =>
		api.value ? getLibraryImageUrl(api.value, props.item) : undefined,
	);

	const backdropStyle = computed(() =>
		backdropUrl.value ? { backgroundImage: `url(${backdropUrl.value})` } : {},
	);

	const runtimeMinutes = computed(() =>
		props.item.RunTimeTicks ? Math.round(props.item.RunTimeTicks / 600_000_000) : undefined,
	);

	const genres = computed(() => props.item.Genres?.join(', '));
</script>
