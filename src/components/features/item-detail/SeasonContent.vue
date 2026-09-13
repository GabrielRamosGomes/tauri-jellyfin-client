<template>
	<div class="item-detail-children">
		<h2>Episodes</h2>

		<div v-if="episodes.length" class="episode-list">
			<episode-list-item v-for="episode in episodes" :key="episode.Id" :item="episode" />
		</div>
		<p v-else-if="!loading" class="server-meta">Nothing here yet.</p>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import EpisodeListItem from '@/components/features/item-detail/EpisodeListItem.vue';

	defineProps<{ episodes: BaseItemDto[]; loading: boolean }>();
</script>
