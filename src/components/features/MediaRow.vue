<template>
	<ui-scrollable-row :title="title" :items="items">
		<template v-if="variant === 'landscape'">
			<media-episode-card
				v-for="item in items"
				:key="item.Id"
				:item="item"
				class="media-row-card media-row-card--landscape"
			/>
		</template>
		<template v-else-if="variant === 'library'">
			<library-card
				v-for="item in items"
				:key="item.Id"
				:library="item"
				class="media-row-card media-row-card--library"
			/>
		</template>
		<template v-else>
			<media-item-card v-for="item in items" :key="item.Id" :item="item" class="media-row-card" />
		</template>
	</ui-scrollable-row>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiScrollableRow from '@/components/ui/UiScrollableRow.vue';

	import LibraryCard from './LibraryCard.vue';
	import MediaEpisodeCard from './MediaEpisodeCard.vue';
	import MediaItemCard from './MediaItemCard.vue';

	withDefaults(
		defineProps<{
			title: string;
			items: BaseItemDto[];
			variant?: 'poster' | 'landscape' | 'library';
		}>(),
		{ variant: 'poster' },
	);
</script>
