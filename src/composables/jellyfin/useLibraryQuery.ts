import type { LibraryQuery, NameFilter } from '@/api/jellyfin/library';

import { ItemFilter, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { computed, ref } from 'vue';

export const ALL_LETTERS = 'All';
export const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

export type LibrarySortKey = 'name' | 'dateAdded' | 'releaseDate' | 'rating';
export type WatchedFilter = 'all' | 'unwatched' | 'watched';

const SORTS: Record<LibrarySortKey, { sortBy: ItemSortBy[]; order: SortOrder }> = {
	name: { sortBy: [ItemSortBy.SortName], order: SortOrder.Ascending },
	dateAdded: { sortBy: [ItemSortBy.DateCreated, ItemSortBy.SortName], order: SortOrder.Descending },
	releaseDate: {
		sortBy: [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName],
		order: SortOrder.Descending,
	},
	rating: { sortBy: [ItemSortBy.CommunityRating, ItemSortBy.SortName], order: SortOrder.Descending },
};

const WATCHED_FILTERS: Record<WatchedFilter, ItemFilter[] | undefined> = {
	all: undefined,
	unwatched: [ItemFilter.IsUnplayed],
	watched: [ItemFilter.IsPlayed],
};

export function useLibraryQuery() {
	const letter = ref(ALL_LETTERS);
	const sortKey = ref<LibrarySortKey>('name');
	const sortOrder = ref<SortOrder>(SORTS.name.order);
	const watched = ref<WatchedFilter>('all');
	const genreIds = ref<string[]>([]);

	const hasActiveFilter = computed(
		() => letter.value !== ALL_LETTERS || watched.value !== 'all' || genreIds.value.length > 0,
	);

	// Same mapping jellyfin-web uses: "#" is everything sorting before "A" (digits, symbols).
	const nameFilter = computed<NameFilter>(() => {
		if (letter.value === ALL_LETTERS) return {};
		if (letter.value === '#') return { nameLessThan: 'A' };
		return { nameStartsWith: letter.value };
	});

	const query = computed<LibraryQuery>(() => ({
		sortBy: SORTS[sortKey.value].sortBy,
		sortOrder: sortOrder.value,
		filters: WATCHED_FILTERS[watched.value],
		genreIds: genreIds.value.length ? genreIds.value : undefined,
		nameFilter: nameFilter.value,
	}));

	function setSort(key: LibrarySortKey) {
		sortKey.value = key;
		sortOrder.value = SORTS[key].order;
		// The rail is hidden outside name sort, so a leftover letter would be an invisible filter.
		if (key !== 'name') letter.value = ALL_LETTERS;
	}

	function toggleOrder() {
		sortOrder.value =
			sortOrder.value === SortOrder.Ascending ? SortOrder.Descending : SortOrder.Ascending;
	}

	function clearFilters() {
		letter.value = ALL_LETTERS;
		watched.value = 'all';
		genreIds.value = [];
	}

	return {
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
	};
}
