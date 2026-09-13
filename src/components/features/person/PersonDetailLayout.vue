<template>
	<div class="person-detail-page" :style="pageTintStyle">
		<div class="person-detail-backdrop" :style="backdropStyle" />
		<div class="person-detail-scrim" />

		<div class="person-detail-content">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useDominantColor } from '@/composables/ui/useDominantColor';
	import { computed, onBeforeUnmount, watch } from 'vue';

	const props = defineProps<{ person: BaseItemDto }>();
	const { libraryImageUrl } = useMediaImages();
	const { color: tintColor, setFromImage, clear } = useDominantColor();

	// People have no landscape backdrop, so the portrait itself becomes the
	// blurred wash behind the header.
	const photoUrl = computed(() => libraryImageUrl(props.person));

	const backdropStyle = computed(() =>
		photoUrl.value ? { backgroundImage: `url(${photoUrl.value})` } : {},
	);

	const pageTintStyle = computed(() =>
		tintColor.value ? { '--item-detail-tint': tintColor.value } : {},
	);

	watch(photoUrl, (value) => setFromImage(value), { immediate: true });

	onBeforeUnmount(() => clear());
</script>
