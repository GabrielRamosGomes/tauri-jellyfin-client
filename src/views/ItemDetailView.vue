<template>
	<item-detail-layout
		v-if="item"
		:item="item">
		<season-header
			v-if="item.Type === 'Season'"
			:item="item"
			:episodes="episodes" />
		<episode-header
			v-else-if="item.Type === 'Episode'"
			:item="item" />
		<item-detail-header
			v-else
			:item="item" />

		<series-content
			v-if="item.Type === 'Series'"
			:item="item" />
		<season-content
			v-else-if="item.Type === 'Season'"
			:episodes="episodes"
			:loading="episodesLoading" />

		<cast-row
			v-if="item.People?.length"
			:people="item.People" />
	</item-detail-layout>
	<div
		v-else-if="loading"
		class="page-loader">
		<ui-spinner :size="40" />
	</div>
	<p
		v-if="errorMessage"
		class="error-msg">
		{{ errorMessage }}
	</p>
</template>

<script setup lang="ts">
	import EpisodeHeader from '@/components/features/item-detail/EpisodeHeader.vue';
	import ItemDetailHeader from '@/components/features/item-detail/ItemDetailHeader.vue';
	import ItemDetailLayout from '@/components/features/item-detail/ItemDetailLayout.vue';
	import SeasonContent from '@/components/features/item-detail/SeasonContent.vue';
	import SeasonHeader from '@/components/features/item-detail/SeasonHeader.vue';
	import SeriesContent from '@/components/features/item-detail/SeriesContent.vue';
	import CastRow from '@/components/features/media/CastRow.vue';
	import UiSpinner from '@/components/ui/UiSpinner.vue';
	import { useItemDetail } from '@/composables/jellyfin/useItemDetail';
	import { useSeasonEpisodes } from '@/composables/jellyfin/useSeasonEpisodes';
	import { computed } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const itemId = computed(() => route.params.id as string);
	const { item, loading, errorMessage } = useItemDetail(itemId);

	// Episodes are fetched once here so both the season header (meta, progress,
	// resume) and the episode grid share a single request.
	const seasonId = computed(() => (item.value?.Type === 'Season' ? (item.value.Id ?? '') : ''));
	const seasonNumber = computed(() =>
		item.value?.Type === 'Season' ? (item.value.IndexNumber ?? undefined) : undefined,
	);
	const { episodes, loading: episodesLoading } = useSeasonEpisodes(seasonId, seasonNumber);
</script>
