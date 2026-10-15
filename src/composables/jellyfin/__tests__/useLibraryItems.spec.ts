import { getLibraryItems, type LibraryQuery } from '@/api/jellyfin/library';
import { useLibraryItems } from '@/composables/jellyfin/useLibraryItems';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred, withScope } from '@/test/utils';
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/library');

const byName: LibraryQuery = { sortBy: [ItemSortBy.SortName], sortOrder: SortOrder.Ascending };

function page(ids: string[], total: number) {
	return { items: ids.map((Id) => makeItem({ Id })), total };
}

function load(libraryId = ref('lib-1'), query = ref(byName)) {
	const [library] = withScope(() => useLibraryItems(libraryId, query));
	const ids = () => library.items.value.map((item) => item.Id);
	return { ...library, ids, libraryId, query };
}

beforeEach(() => {
	signOut();
	signIn();
});

describe('useLibraryItems', () => {
	it('loads the first page on start', async () => {
		vi.mocked(getLibraryItems).mockResolvedValue(page(['a', 'b'], 250));

		const library = load();
		await flushPromises();

		expect(library.ids()).toEqual(['a', 'b']);
		expect(library.total.value).toBe(250);
		expect(library.hasMore.value).toBe(true);
		expect(getLibraryItems).toHaveBeenCalledWith(
			expect.anything(),
			'user-1',
			'lib-1',
			expect.objectContaining({ startIndex: 0, ...byName }),
		);
	});

	it('appends the next page, starting where the loaded items end', async () => {
		vi.mocked(getLibraryItems)
			.mockResolvedValueOnce(page(['a', 'b'], 3))
			.mockResolvedValueOnce(page(['c'], 3));
		const library = load();
		await flushPromises();

		await library.loadMore();

		expect(library.ids()).toEqual(['a', 'b', 'c']);
		expect(vi.mocked(getLibraryItems).mock.calls[1][3].startIndex).toBe(2);
		expect(library.hasMore.value).toBe(false);
	});

	it('does not request past the end of the library', async () => {
		vi.mocked(getLibraryItems).mockResolvedValue(page(['a', 'b'], 2));
		const library = load();
		await flushPromises();

		await library.loadMore();

		expect(getLibraryItems).toHaveBeenCalledTimes(1);
	});

	it('ignores repeated load-more triggers while a page is already loading', async () => {
		const nextPage = deferred<ReturnType<typeof page>>();
		vi.mocked(getLibraryItems)
			.mockResolvedValueOnce(page(['a'], 3))
			.mockReturnValueOnce(nextPage.promise);
		const library = load();
		await flushPromises();

		library.loadMore();
		library.loadMore();
		library.loadMore();
		nextPage.resolve(page(['b'], 3));
		await flushPromises();

		expect(getLibraryItems).toHaveBeenCalledTimes(2);
		expect(library.ids()).toEqual(['a', 'b']);
	});

	it.each([
		[
			'the query changes',
			(lib: ReturnType<typeof load>) => (lib.query.value = { ...byName, genreIds: ['g1'] }),
		],
		[
			'another library is opened',
			(lib: ReturnType<typeof load>) => (lib.libraryId.value = 'lib-2'),
		],
	])('starts over from the first page when %s', async (_, change) => {
		vi.mocked(getLibraryItems)
			.mockResolvedValueOnce(page(['a', 'b'], 4))
			.mockResolvedValueOnce(page(['c', 'd'], 4))
			.mockResolvedValueOnce(page(['x'], 1));
		const library = load();
		await flushPromises();
		await library.loadMore();

		change(library);
		await flushPromises();

		expect(library.ids()).toEqual(['x']);
		expect(library.total.value).toBe(1);
		expect(vi.mocked(getLibraryItems).mock.calls[2][3].startIndex).toBe(0);
	});

	describe('when the query changes while a next page is loading', () => {
		function filterMidPage() {
			const stalePage = deferred<ReturnType<typeof page>>();
			const filteredPage = deferred<ReturnType<typeof page>>();
			vi.mocked(getLibraryItems)
				.mockResolvedValueOnce(page(['a1'], 2))
				.mockReturnValueOnce(stalePage.promise)
				.mockReturnValueOnce(filteredPage.promise);
			return { library: load(), stalePage, filteredPage };
		}

		it('drops the unfiltered page instead of appending it to the filtered results', async () => {
			const { library, stalePage, filteredPage } = filterMidPage();
			await flushPromises();
			library.loadMore();
			library.query.value = { ...byName, genreIds: ['g1'] };
			await flushPromises();

			filteredPage.resolve(page(['g1'], 1));
			await flushPromises();
			stalePage.resolve(page(['a2'], 2));
			await flushPromises();

			expect(library.ids()).toEqual(['g1']);
			expect(library.total.value).toBe(1);
			expect(library.loading.value).toBe(false);
		});

		it('stays loading until the filtered page arrives', async () => {
			const { library, stalePage } = filterMidPage();
			await flushPromises();
			library.loadMore();
			library.query.value = { ...byName, genreIds: ['g1'] };
			await flushPromises();

			stalePage.resolve(page(['a2'], 2));
			await flushPromises();

			expect(library.loading.value).toBe(true);
			expect(library.ids()).toEqual(['a1']);
		});
	});

	it('keeps the already loaded items when loading more fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(getLibraryItems)
			.mockResolvedValueOnce(page(['a', 'b'], 4))
			.mockRejectedValueOnce(new Error('Server returned 500'));
		const library = load();
		await flushPromises();

		await library.loadMore();

		expect(library.ids()).toEqual(['a', 'b']);
		expect(library.errorMessage.value).toBe('Server returned 500');
		expect(library.loading.value).toBe(false);
	});

	it('does not request anything without a library id', async () => {
		load(ref(''));
		await flushPromises();

		expect(getLibraryItems).not.toHaveBeenCalled();
	});
});
