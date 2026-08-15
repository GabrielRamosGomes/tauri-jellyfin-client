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
	import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
	import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

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

	const trackRef = ref<HTMLDivElement | null>(null);
	const canScrollLeft = ref(false);
	const canScrollRight = ref(false);

	function updateScrollState() {
		const track = trackRef.value;
		if (!track) return;

		canScrollLeft.value = track.scrollLeft > 1;
		canScrollRight.value = track.scrollLeft + track.clientWidth < track.scrollWidth - 1;
	}

	function scroll(direction: 1 | -1) {
		const track = trackRef.value;
		if (!track) return;

		track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
	}

	let resizeObserver: ResizeObserver | undefined;

	onMounted(() => {
		const track = trackRef.value;
		if (!track) return;

		updateScrollState();
		track.addEventListener('scroll', updateScrollState, { passive: true });

		resizeObserver = new ResizeObserver(updateScrollState);
		resizeObserver.observe(track);
	});

	onBeforeUnmount(() => {
		trackRef.value?.removeEventListener('scroll', updateScrollState);
		resizeObserver?.disconnect();
	});

	watch(
		() => props.items,
		() => nextTick(updateScrollState),
	);
</script>
