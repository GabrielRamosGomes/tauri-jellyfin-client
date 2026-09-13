<template>
	<div
		class="item-detail-page"
		:style="pageTintStyle">
		<div
			class="item-detail-backdrop"
			:class="{ 'item-detail-backdrop--blur': isSeason }"
			:style="backdropStyle" />
		<div class="item-detail-scrim" />

		<div class="item-detail-content">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useDominantColor } from '@/composables/ui/useDominantColor';
	import { computed, onBeforeUnmount, watch } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { backdropUrl, libraryImageUrl } = useMediaImages();
	const { color: tintColor, setFromImage, clear } = useDominantColor();

	const isSeason = computed(() => props.item.Type === 'Season');

	function backdropFor(item: BaseItemDto) {
		return isSeason.value ? libraryImageUrl(item) : backdropUrl(item);
	}

	const backdropStyle = computed(() => {
		const url = backdropFor(props.item);
		return url ? { backgroundImage: `url(${url})` } : {};
	});

	const pageTintStyle = computed(() =>
		tintColor.value ? { '--item-detail-tint': tintColor.value } : {},
	);

	watch(
		() => props.item,
		(value) => {
			if (isSeason.value) clear();
			else setFromImage(backdropFor(value));
		},
		{ immediate: true },
	);

	onBeforeUnmount(() => clear());
</script>
