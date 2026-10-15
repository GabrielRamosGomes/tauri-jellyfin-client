<template>
	<div>
		<div class="library-header">
			<h1>{{ libraryName }}</h1>
			<span
				v-if="total"
				class="library-count"
				>{{ total }}</span
			>
		</div>

		<div class="library-body">
			<template v-if="items.length">
				<div class="item-grid">
					<media-item-card
						v-for="item in items"
						:key="item.Id"
						:item="item" />
				</div>
				<div
					v-if="loading && hasMore"
					class="library-loading-more">
					<ui-spinner :size="28" />
				</div>
			</template>
			<div
				v-else-if="loading"
				class="item-grid">
				<media-item-card-skeleton
					v-for="n in 18"
					:key="n" />
			</div>
			<ui-empty-state
				v-else
				class="library-empty"
				:title="letter === ALL_LETTERS ? 'This library is empty' : `No titles under ${letter}`"
				:description="
					letter === ALL_LETTERS
						? 'Items will show up here once your server adds them.'
						: 'Try another letter or browse the whole library.'
				">
				<ui-button
					v-if="letter !== ALL_LETTERS"
					variant="secondary"
					@click="letter = ALL_LETTERS">
					Show all titles
				</ui-button>
			</ui-empty-state>

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
	import UiButton from '@/components/ui/UiButton.vue';
	import UiEmptyState from '@/components/ui/UiEmptyState.vue';
	import UiSpinner from '@/components/ui/UiSpinner.vue';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { useLibraryItems } from '@/composables/jellyfin/useLibraryItems';
	import { ALL_LETTERS, useAlphabetFilter } from '@/composables/ui/useAlphabetFilter';
	import { useInfiniteScroll } from '@vueuse/core';
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

	const { items, total, loading, errorMessage, hasMore, loadMore } = useLibraryItems(
		libraryId,
		nameFilter,
	);

	watch(letter, () => window.scrollTo({ top: 0 }));

	// The document is the scroll container (AppShell grows with content), not .app-content.
	useInfiniteScroll(window, loadMore, {
		distance: 600,
		canLoadMore: () => hasMore.value && !loading.value,
	});
</script>
