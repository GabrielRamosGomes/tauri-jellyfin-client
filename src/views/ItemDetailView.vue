<template>
	<item-detail-layout v-if="item" :item="item">
		<item-detail-header :item="item" />

		<series-content v-if="item.Type === 'Series'" :item="item" />
		<season-content v-else-if="item.Type === 'Season'" :item="item" />

		<cast-row v-if="item.People?.length" :people="item.People" />
	</item-detail-layout>
	<p v-else-if="loading" class="server-meta">Loading...</p>
	<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
</template>

<script setup lang="ts">
	import CastRow from '@/components/features/CastRow.vue';
	import ItemDetailHeader from '@/components/features/ItemDetailHeader.vue';
	import ItemDetailLayout from '@/components/features/ItemDetailLayout.vue';
	import SeasonContent from '@/components/features/SeasonContent.vue';
	import SeriesContent from '@/components/features/SeriesContent.vue';
	import { useItemDetail } from '@/composables/jellyfin/useItemDetail';
	import { computed } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const itemId = computed(() => route.params.id as string);
	const { item, loading, errorMessage } = useItemDetail(itemId);
</script>
