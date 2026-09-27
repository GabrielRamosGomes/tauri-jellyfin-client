<template>
	<div>
		<div class="library-header">
			<h1>{{ libraryName }}</h1>
			<span
				v-if="items.length"
				class="library-count"
				>{{ items.length }}</span
			>
		</div>

		<div class="library-body">
			<div
				v-if="items.length"
				class="item-grid">
				<media-item-card
					v-for="item in items"
					:key="item.Id"
					:item="item" />
			</div>
			<div
				v-else-if="loading"
				class="item-grid">
				<media-item-card-skeleton
					v-for="n in 18"
					:key="n" />
			</div>
			<p
				v-else
				class="server-meta library-empty">
				{{
					letter === ALL_LETTERS
						? 'No items in this library yet.'
						: `No titles under ${letter}.`
				}}
			</p>

			<alphabet-rail
				v-if="items.length || letter !== ALL_LETTERS"
				v-model="letter"
				:disabled="loading" />
		</div>

		<p
			v-if="errorMessage"
			class="error-msg">
			{{ errorMessage }}
		</p>
	</div>
</template>

<script setup lang="ts">
	import AlphabetRail from '@/components/features/library/AlphabetRail.vue';
	import MediaItemCard from '@/components/features/media/MediaItemCard.vue';
	import MediaItemCardSkeleton from '@/components/features/media/MediaItemCardSkeleton.vue';
	import { useChildItems } from '@/composables/jellyfin/useChildItems';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { ALL_LETTERS, useAlphabetFilter } from '@/composables/ui/useAlphabetFilter';
	import { computed, watch } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const { libraries } = useLibraries();

	const libraryId = computed(() => route.params.id as string);
	const libraryName = computed(
		() => libraries.value.find((library) => library.Id === libraryId.value)?.Name ?? 'Library',
	);

	const { letter, nameFilter } = useAlphabetFilter();

	// Sync so the letter resets before the items watcher runs; otherwise a library switch fires two fetches.
	watch(libraryId, () => (letter.value = ALL_LETTERS), { flush: 'sync' });

	const { items, loading, errorMessage } = useChildItems(libraryId, undefined, nameFilter);
</script>
