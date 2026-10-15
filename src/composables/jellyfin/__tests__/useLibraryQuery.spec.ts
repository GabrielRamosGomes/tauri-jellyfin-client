import { ALL_LETTERS, useLibraryQuery } from '@/composables/jellyfin/useLibraryQuery';
import { ItemFilter, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { describe, expect, it } from 'vitest';

describe('useLibraryQuery', () => {
	it('starts as an unfiltered A–Z listing', () => {
		const { query, hasActiveFilter } = useLibraryQuery();

		expect(query.value).toEqual({
			sortBy: [ItemSortBy.SortName],
			sortOrder: SortOrder.Ascending,
			filters: undefined,
			genreIds: undefined,
			nameFilter: {},
		});
		expect(hasActiveFilter.value).toBe(false);
	});

	it.each([
		['B', { nameStartsWith: 'B' }],
		['#', { nameLessThan: 'A' }],
		[ALL_LETTERS, {}],
	])('maps the "%s" letter to the name filter', (letter, nameFilter) => {
		const library = useLibraryQuery();

		library.letter.value = letter;

		expect(library.query.value.nameFilter).toEqual(nameFilter);
	});

	it.each([
		['unwatched', [ItemFilter.IsUnplayed]],
		['watched', [ItemFilter.IsPlayed]],
		['all', undefined],
	] as const)('maps the "%s" watched filter', (watched, filters) => {
		const library = useLibraryQuery();

		library.watched.value = watched;

		expect(library.query.value.filters).toEqual(filters);
	});

	it('sends selected genres, and no genre filter once all are deselected', () => {
		const library = useLibraryQuery();

		library.genreIds.value = ['g1', 'g2'];
		expect(library.query.value.genreIds).toEqual(['g1', 'g2']);

		library.genreIds.value = [];
		expect(library.query.value.genreIds).toBeUndefined();
	});

	describe('sorting', () => {
		it.each([
			['dateAdded', [ItemSortBy.DateCreated, ItemSortBy.SortName]],
			['releaseDate', [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName]],
			['rating', [ItemSortBy.CommunityRating, ItemSortBy.SortName]],
		] as const)('sorts by %s newest/highest first', (key, sortBy) => {
			const library = useLibraryQuery();

			library.setSort(key);

			expect(library.query.value.sortBy).toEqual(sortBy);
			expect(library.query.value.sortOrder).toBe(SortOrder.Descending);
		});

		it('drops the letter filter when leaving name sort, since the alphabet rail is hidden', () => {
			const library = useLibraryQuery();
			library.letter.value = 'M';

			library.setSort('rating');

			expect(library.letter.value).toBe(ALL_LETTERS);
			expect(library.query.value.nameFilter).toEqual({});
		});

		it('keeps the letter filter when re-selecting name sort', () => {
			const library = useLibraryQuery();
			library.letter.value = 'M';

			library.setSort('name');

			expect(library.letter.value).toBe('M');
		});

		it('flips the order, and a new sort restores its own default order', () => {
			const library = useLibraryQuery();

			library.toggleOrder();
			expect(library.sortOrder.value).toBe(SortOrder.Descending);
			library.toggleOrder();
			expect(library.sortOrder.value).toBe(SortOrder.Ascending);

			library.toggleOrder();
			library.setSort('dateAdded');
			library.setSort('name');
			expect(library.sortOrder.value).toBe(SortOrder.Ascending);
		});
	});

	describe('filters', () => {
		it.each([
			['a letter', (lib: ReturnType<typeof useLibraryQuery>) => (lib.letter.value = 'B')],
			[
				'a watched filter',
				(lib: ReturnType<typeof useLibraryQuery>) => (lib.watched.value = 'unwatched'),
			],
			['a genre', (lib: ReturnType<typeof useLibraryQuery>) => (lib.genreIds.value = ['g1'])],
		])('counts %s as an active filter', (_, apply) => {
			const library = useLibraryQuery();

			apply(library);

			expect(library.hasActiveFilter.value).toBe(true);
		});

		it('does not count the sort as a filter', () => {
			const library = useLibraryQuery();

			library.setSort('rating');
			library.toggleOrder();

			expect(library.hasActiveFilter.value).toBe(false);
		});

		it('clears every filter but keeps the chosen sort', () => {
			const library = useLibraryQuery();
			library.letter.value = 'B';
			library.watched.value = 'watched';
			library.genreIds.value = ['g1'];
			library.toggleOrder();

			library.clearFilters();

			expect(library.hasActiveFilter.value).toBe(false);
			expect(library.sortOrder.value).toBe(SortOrder.Descending);
		});
	});

	it('gives each library screen its own independent state', () => {
		const first = useLibraryQuery();
		const second = useLibraryQuery();

		first.letter.value = 'B';

		expect(second.letter.value).toBe(ALL_LETTERS);
	});
});
