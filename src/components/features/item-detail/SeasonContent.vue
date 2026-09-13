<template>
	<div class="item-detail-children">
		<h2>Episodes</h2>

		<div
			v-if="loading && !episodes.length"
			class="episode-list">
			<episode-card-skeleton
				v-for="n in 8"
				:key="n" />
		</div>
		<div
			v-else-if="episodes.length"
			class="episode-list">
			<episode-list-item
				v-for="episode in episodes"
				:key="episode.Id"
				:item="episode" />
		</div>
		<p
			v-else
			class="server-meta">
			Nothing here yet.
		</p>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import EpisodeCardSkeleton from '@/components/features/item-detail/EpisodeCardSkeleton.vue';
	import EpisodeListItem from '@/components/features/item-detail/EpisodeListItem.vue';

	defineProps<{ episodes: BaseItemDto[]; loading: boolean }>();
</script>
