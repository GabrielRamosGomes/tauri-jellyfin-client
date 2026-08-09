<template>
	<router-link :to="{ name: 'library', params: { id: library.Id } }" class="library-card">
		<img
			v-if="imageUrl && !imageFailed"
			:src="imageUrl"
			:alt="library.Name ?? ''"
			loading="lazy"
			@error="imageFailed = true"
		/>
		<span class="library-card-title">{{ library.Name }}</span>
	</router-link>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { getLibraryImageUrl } from '@/api/jellyfin/library';
	import { useServerConnection } from '@/composables/useServerConnection';
	import { computed, ref } from 'vue';

	const props = defineProps<{ library: BaseItemDto }>();
	const { api } = useServerConnection();

	const imageFailed = ref(false);

	const imageUrl = computed(() =>
		api.value ? getLibraryImageUrl(api.value, props.library) : undefined,
	);
</script>
