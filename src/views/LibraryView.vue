<template>
	<div>
		<div class="library-header">
			<h1>{{ libraryName }}</h1>
			<span v-if="items.length" class="library-count">{{ items.length }}</span>
		</div>

		<div v-if="items.length" class="item-grid">
			<media-item-card v-for="item in items" :key="item.Id" :item="item" />
		</div>
		<p v-else-if="loading" class="server-meta">Loading...</p>
		<p v-else class="server-meta">No items in this library yet.</p>

		<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
	</div>
</template>

<script setup lang="ts">
	import MediaItemCard from '@/components/features/MediaItemCard.vue';
	import { useChildItems } from '@/composables/jellyfin/useChildItems';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { computed } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const { libraries } = useLibraries();

	const libraryId = computed(() => route.params.id as string);
	const libraryName = computed(
		() => libraries.value.find((library) => library.Id === libraryId.value)?.Name ?? 'Library',
	);

	const { items, loading, errorMessage } = useChildItems(libraryId);
</script>
