<template>
	<div class="item-detail-children">
		<h2>Episodes</h2>

		<div v-if="episodes.length" class="episode-list">
			<episode-list-item v-for="episode in episodes" :key="episode.Id" :item="episode" />
		</div>
		<p v-else-if="childrenLoading" class="server-meta">Loading...</p>
		<p v-else class="server-meta">Nothing here yet.</p>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import EpisodeListItem from '@/components/features/EpisodeListItem.vue';
	import { useChildItems } from '@/composables/jellyfin/useChildItems';
	import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
	import { computed } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();

	const parentId = computed(() => props.item.Id ?? '');
	const { items: children, loading: childrenLoading } = useChildItems(parentId, [
		ItemSortBy.IndexNumber,
	]);

	const episodes = computed(() => {
		const seen = new Set<number>();

		return children.value.filter((child) => {
			const index = child.IndexNumber;
			if (index === undefined || index === null || seen.has(index)) return false;

			seen.add(index);
			return true;
		});
	});
</script>
