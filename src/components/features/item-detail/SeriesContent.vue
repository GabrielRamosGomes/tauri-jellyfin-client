<template>
	<div v-if="nextUpItem" class="series-content-row">
		<div class="next-up-section">
			<h2 class="scrollable-row-title">Next Up</h2>
			<media-episode-card :item="nextUpItem" class="next-up-card" />
		</div>

		<media-row v-if="children.length" title="Seasons" :items="children" class="series-seasons" />
	</div>

	<template v-else>
		<media-row v-if="children.length" title="Seasons" :items="children" />
		<p v-else-if="childrenLoading" class="server-meta">Loading...</p>
		<p v-else class="server-meta">Nothing here yet.</p>
	</template>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import MediaEpisodeCard from '@/components/features/media/MediaEpisodeCard.vue';
	import MediaRow from '@/components/features/media/MediaRow.vue';
	import { useChildItems } from '@/composables/jellyfin/useChildItems';
	import { useNextUp } from '@/composables/jellyfin/useNextUp';
	import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
	import { computed } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();

	const seriesId = computed(() => props.item.Id ?? '');
	const parentId = computed(() => props.item.Id ?? '');

	const { nextUpItem } = useNextUp(seriesId);
	const { items: children, loading: childrenLoading } = useChildItems(parentId, [
		ItemSortBy.IndexNumber,
	]);
</script>
