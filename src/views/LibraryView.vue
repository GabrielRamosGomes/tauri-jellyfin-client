<template>
	<div>
		<div class="library-header">
			<h1>{{ libraryName }}</h1>
			<span
				v-if="total"
				class="library-count"
				>{{ total }}</span
			>

			<library-toolbar
				v-model:watched="watched"
				v-model:genre-ids="genreIds"
				:genres="genres"
				:sort-key="sortKey"
				:ascending="sortOrder === SortOrder.Ascending"
				:disabled="loading"
				@update:sort-key="setSort"
				@toggle-order="toggleOrder" />
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
				:title="emptyTitle"
				:description="
					hasActiveFilter
						? 'Try different filters or browse the whole library.'
						: 'Items will show up here once your server adds them.'
				">
				<ui-button
					v-if="hasActiveFilter"
					variant="secondary"
					@click="clearFilters">
					Clear filters
				</ui-button>
			</ui-empty-state>

			<alphabet-rail
				v-if="sortKey === 'name' && (items.length || hasActiveFilter)"
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
	import LibraryToolbar from '@/components/features/library/LibraryToolbar.vue';
	import MediaItemCard from '@/components/features/media/MediaItemCard.vue';
	import MediaItemCardSkeleton from '@/components/features/media/MediaItemCardSkeleton.vue';
	import UiButton from '@/components/ui/UiButton.vue';
	import UiEmptyState from '@/components/ui/UiEmptyState.vue';
	import UiSpinner from '@/components/ui/UiSpinner.vue';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { useLibraryGenres } from '@/composables/jellyfin/useLibraryGenres';
	import { useLibraryItems } from '@/composables/jellyfin/useLibraryItems';
	import { ALL_LETTERS, useLibraryQuery } from '@/composables/jellyfin/useLibraryQuery';
	import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
	import { useInfiniteScroll } from '@vueuse/core';
	import { computed, watch } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const { libraries } = useLibraries();

	const libraryId = computed(() => route.params.id as string);
	const libraryName = computed(
		() => libraries.value.find((library) => library.Id === libraryId.value)?.Name ?? 'Library',
	);

	const {
		letter,
		sortKey,
		sortOrder,
		watched,
		genreIds,
		hasActiveFilter,
		query,
		setSort,
		toggleOrder,
		clearFilters,
	} = useLibraryQuery();

	// Sync so filters reset before the items watcher runs; otherwise a library switch fires two fetches.
	watch(libraryId, clearFilters, { flush: 'sync' });

	const { genres } = useLibraryGenres(libraryId);

	const { items, total, loading, errorMessage, hasMore, loadMore } = useLibraryItems(
		libraryId,
		query,
	);

	const emptyTitle = computed(() => {
		if (genreIds.value.length) return 'No titles match these filters';
		const status = watched.value === 'all' ? '' : `${watched.value} `;
		if (letter.value !== ALL_LETTERS) return `No ${status}titles under ${letter.value}`;
		if (status) return `No ${status}titles`;
		return 'This library is empty';
	});

	watch(query, () => window.scrollTo({ top: 0 }));

	// The document is the scroll container (AppShell grows with content), not .app-content.
	useInfiniteScroll(window, loadMore, {
		distance: 600,
		canLoadMore: () => hasMore.value && !loading.value,
	});
</script>
