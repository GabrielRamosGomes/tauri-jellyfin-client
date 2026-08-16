<template>
	<div class="item-detail-page" :style="pageTintStyle">
		<div class="item-detail-backdrop" :style="backdropStyle" />
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
	const { backdropUrl } = useMediaImages();
	const { color: tintColor, setFromImage, clear } = useDominantColor();

	const backdropStyle = computed(() => {
		const url = backdropUrl(props.item);
		return url ? { backgroundImage: `url(${url})` } : {};
	});

	const pageTintStyle = computed(() =>
		tintColor.value ? { '--item-detail-tint': tintColor.value } : {},
	);

	watch(
		() => props.item,
		(value) => setFromImage(backdropUrl(value)),
		{ immediate: true },
	);

	onBeforeUnmount(() => clear());
</script>
