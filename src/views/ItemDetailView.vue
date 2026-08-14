<template>
	<div v-if="item">
		<item-detail-header :item="item" />

		<div v-if="showChildren" class="item-detail-children">
			<h2>{{ childrenLabel }}</h2>

			<div v-if="children.length" class="item-grid">
				<media-item-card v-for="child in children" :key="child.Id" :item="child" />
			</div>
			<p v-else-if="childrenLoading" class="server-meta">Loading...</p>
			<p v-else class="server-meta">Nothing here yet.</p>
		</div>
	</div>
	<p v-else-if="loading" class="server-meta">Loading...</p>
	<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
</template>

<script setup lang="ts">
	import ItemDetailHeader from '@/components/ItemDetailHeader.vue';
	import MediaItemCard from '@/components/MediaItemCard.vue';
	import { useChildItems } from '@/composables/useChildItems';
	import { useItemDetail } from '@/composables/useItemDetail';
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
</script>
