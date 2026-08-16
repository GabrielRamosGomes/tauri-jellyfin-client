<template>
	<router-link :to="{ name: 'library', params: { id: library.Id } }" class="library-card">
		<div class="library-card-media">
			<img
				v-if="imageUrl && !imageFailed"
				:src="imageUrl"
				:alt="library.Name ?? ''"
				@error="imageFailed = true"
			/>
		</div>
		<p class="library-card-caption">{{ library.Name }}</p>
	</router-link>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { computed, ref } from 'vue';

	const props = defineProps<{ library: BaseItemDto }>();
	const { libraryImageUrl } = useMediaImages();

	const imageFailed = ref(false);

	const imageUrl = computed(() => libraryImageUrl(props.library));
</script>
