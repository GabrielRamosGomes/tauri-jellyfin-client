<template>
	<section v-if="items.length" class="media-row">
		<div class="media-row-header">
			<h2 class="media-row-title">{{ title }}</h2>
			<div class="media-row-controls">
				<ui-icon-button
					:icon="ChevronLeft"
					label="Scroll left"
					:disabled="!canScrollLeft"
					@click="scroll(-1)"
				/>
				<ui-icon-button
					:icon="ChevronRight"
					label="Scroll right"
					:disabled="!canScrollRight"
					@click="scroll(1)"
				/>
			</div>
		</div>

		<div ref="trackRef" class="media-row-track">
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
		</div>
	</section>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useScrollTrack } from '@/composables/ui/useScrollTrack';
	import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
	import { computed } from 'vue';

	import LibraryCard from './LibraryCard.vue';
	import MediaEpisodeCard from './MediaEpisodeCard.vue';
	import MediaItemCard from './MediaItemCard.vue';

	const props = withDefaults(
		defineProps<{
			title: string;
			items: BaseItemDto[];
			variant?: 'poster' | 'landscape' | 'library';
		}>(),
		{ variant: 'poster' },
	);

	const items = computed(() => props.items);
	const { trackRef, canScrollLeft, canScrollRight, scroll } = useScrollTrack(items);
</script>
