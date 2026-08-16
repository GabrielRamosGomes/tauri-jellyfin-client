<template>
	<media-row v-if="children.length" title="Seasons" :items="children" />
	<p v-else-if="childrenLoading" class="server-meta">Loading...</p>
	<p v-else class="server-meta">Nothing here yet.</p>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import MediaRow from '@/components/features/media/MediaRow.vue';
	import { useChildItems } from '@/composables/jellyfin/useChildItems';
	import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
	import { computed } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();

	const parentId = computed(() => props.item.Id ?? '');
	const { items: children, loading: childrenLoading } = useChildItems(parentId, [
		ItemSortBy.IndexNumber,
	]);
</script>
