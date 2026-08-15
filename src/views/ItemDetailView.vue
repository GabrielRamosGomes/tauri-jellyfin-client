<template>
	<div v-if="item">
		<item-detail-header :item="item" />

		<div v-if="showChildren" class="item-detail-children">
			<h2>{{ childrenLabel }}</h2>

			<template v-if="children.length">
				<div v-if="item.Type === 'Series'" class="item-grid">
					<media-item-card v-for="child in children" :key="child.Id" :item="child" />
				</div>
				<div v-else class="episode-list">
					<episode-list-item v-for="child in episodes" :key="child.Id" :item="child" />
				</div>
			</template>
			<p v-else-if="childrenLoading" class="server-meta">Loading...</p>
			<p v-else class="server-meta">Nothing here yet.</p>
		</div>
	</div>
	<p v-else-if="loading" class="server-meta">Loading...</p>
	<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
</template>

<script setup lang="ts">
	import EpisodeListItem from '@/components/EpisodeListItem.vue';
	import ItemDetailHeader from '@/components/ItemDetailHeader.vue';
	import MediaItemCard from '@/components/MediaItemCard.vue';
	import { useChildItems } from '@/composables/jellyfin/useChildItems';
	import { useItemDetail } from '@/composables/jellyfin/useItemDetail';
	import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
	import { computed } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const itemId = computed(() => route.params.id as string);

	const { item, loading, errorMessage } = useItemDetail(itemId);

	const showChildren = computed(
		() => item.value?.Type === 'Series' || item.value?.Type === 'Season',
	);
	const childrenLabel = computed(() => (item.value?.Type === 'Series' ? 'Seasons' : 'Episodes'));

	const childParentId = computed(() => (showChildren.value ? (item.value?.Id ?? '') : ''));

	const { items: children, loading: childrenLoading } = useChildItems(childParentId, [
		ItemSortBy.IndexNumber,
	]);

	// Some seasons contain extras (recaps, shorts) filed alongside regular
	// episodes that reuse an adjacent episode's IndexNumber instead of having
	// their own — drop those from the list rather than showing duplicate
	// episode numbers.
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
