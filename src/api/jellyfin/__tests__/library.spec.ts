import type { Api } from '@jellyfin/sdk';

import {
	getLandscapeImageUrl,
	getLatestMedia,
	getLibraryGenres,
	getLibraryItems,
	getLogoUrl,
	getNextUp,
	getPersonImageUrl,
	setFavorite,
	setWatched,
} from '@/api/jellyfin/library';
import { makeItem } from '@/test/fixtures/jellyfin';
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@jellyfin/sdk/lib/utils/api/filter-api', () => ({ getFilterApi: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/image-api', () => ({ getImageApi: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/items-api', () => ({ getItemsApi: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/playstate-api', () => ({ getPlaystateApi: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/tv-shows-api', () => ({ getTvShowsApi: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/user-library-api', () => ({ getUserLibraryApi: vi.fn() }));

const api = {} as Api;
const respond = <T>(data: T) => vi.fn().mockResolvedValue({ data });

describe('getLibraryItems', () => {
	const query = {
		startIndex: 100,
		limit: 100,
		sortBy: [ItemSortBy.SortName],
		sortOrder: SortOrder.Descending,
	};
	let getItems: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		getItems = respond({ Items: [], TotalRecordCount: 0 });
		vi.mocked(getItemsApi).mockReturnValue({ getItems } as never);
	});

	it('requests the page window and sort order for the library', async () => {
		await getLibraryItems(api, 'user-1', 'lib-1', query);

		expect(getItems).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-1',
				parentId: 'lib-1',
				startIndex: 100,
				limit: 100,
				sortBy: [ItemSortBy.SortName],
				sortOrder: [SortOrder.Descending],
			}),
		);
	});

	it.each([
		['a letter', { nameStartsWith: 'B' }],
		['"#" (everything before A)', { nameLessThan: 'A' }],
	])('sends the alphabet filter for %s as a top-level request field', async (_, nameFilter) => {
		await getLibraryItems(api, 'user-1', 'lib-1', { ...query, nameFilter });

		expect(getItems).toHaveBeenCalledWith(expect.objectContaining(nameFilter));
	});

	it('sends no name filter when browsing all letters', async () => {
		await getLibraryItems(api, 'user-1', 'lib-1', { ...query, nameFilter: {} });

		const request = getItems.mock.calls[0][0];
		expect(request).not.toHaveProperty('nameStartsWith');
		expect(request).not.toHaveProperty('nameLessThan');
	});

	it('returns the page items with the library-wide total for pagination', async () => {
		const items = [makeItem({ Id: 'a' }), makeItem({ Id: 'b' })];
		getItems.mockResolvedValue({ data: { Items: items, TotalRecordCount: 250 } });

		await expect(getLibraryItems(api, 'user-1', 'lib-1', query)).resolves.toEqual({
			items,
			total: 250,
		});
	});

	it('treats a response without items or total as an empty page', async () => {
		getItems.mockResolvedValue({ data: {} });

		await expect(getLibraryItems(api, 'user-1', 'lib-1', query)).resolves.toEqual({
			items: [],
			total: 0,
		});
	});
});

describe('getLibraryGenres', () => {
	it('drops genres the server returns without an id or a name', async () => {
		vi.mocked(getFilterApi).mockReturnValue({
			getQueryFilters: respond({
				Genres: [
					{ Id: 'g1', Name: 'Action' },
					{ Id: 'g2', Name: null },
					{ Id: null, Name: 'Drama' },
					{ Id: 'g3', Name: '' },
					{ Id: 'g4', Name: 'Sci-Fi' },
				],
			}),
		} as never);

		await expect(getLibraryGenres(api, 'user-1', 'lib-1')).resolves.toEqual([
			{ Id: 'g1', Name: 'Action' },
			{ Id: 'g4', Name: 'Sci-Fi' },
		]);
	});

	it('returns an empty list for a library with no genres', async () => {
		vi.mocked(getFilterApi).mockReturnValue({ getQueryFilters: respond({}) } as never);

		await expect(getLibraryGenres(api, 'user-1', 'lib-1')).resolves.toEqual([]);
	});
});

describe('getLatestMedia', () => {
	it('leaves out individual episodes so a show appears once as its series', async () => {
		const movie = makeItem({ Id: 'm', Type: 'Movie' });
		const series = makeItem({ Id: 's', Type: 'Series' });
		const episode = makeItem({ Id: 'e', Type: 'Episode' });
		vi.mocked(getUserLibraryApi).mockReturnValue({
			getLatestMedia: respond([movie, episode, series]),
		} as never);

		await expect(getLatestMedia(api, 'user-1', 'lib-1')).resolves.toEqual([movie, series]);
	});
});

describe('getNextUp', () => {
	let getNextUpRequest: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		getNextUpRequest = respond({ Items: [] });
		vi.mocked(getTvShowsApi).mockReturnValue({ getNextUp: getNextUpRequest } as never);
	});

	it('asks for a single episode when resolving next up for one series', async () => {
		await getNextUp(api, 'user-1', 'series-1');

		expect(getNextUpRequest).toHaveBeenCalledWith(
			expect.objectContaining({ seriesId: 'series-1', limit: 1 }),
		);
	});

	it('asks for a full row across all series on the home screen', async () => {
		await getNextUp(api, 'user-1');

		const request = getNextUpRequest.mock.calls[0][0];
		expect(request.seriesId).toBeUndefined();
		expect(request.limit).toBeGreaterThan(1);
	});

	it('returns an empty list when nothing is in progress', async () => {
		getNextUpRequest.mockResolvedValue({ data: {} });

		await expect(getNextUp(api, 'user-1')).resolves.toEqual([]);
	});
});

describe('setFavorite / setWatched', () => {
	const userData = { IsFavorite: true, Played: true };
	let userLibraryApi: Record<'markFavoriteItem' | 'unmarkFavoriteItem', ReturnType<typeof vi.fn>>;
	let playstateApi: Record<'markPlayedItem' | 'markUnplayedItem', ReturnType<typeof vi.fn>>;

	beforeEach(() => {
		userLibraryApi = { markFavoriteItem: respond(userData), unmarkFavoriteItem: respond(userData) };
		playstateApi = { markPlayedItem: respond(userData), markUnplayedItem: respond(userData) };
		vi.mocked(getUserLibraryApi).mockReturnValue(userLibraryApi as never);
		vi.mocked(getPlaystateApi).mockReturnValue(playstateApi as never);
	});

	it.each([
		[true, 'markFavoriteItem', 'unmarkFavoriteItem'],
		[false, 'unmarkFavoriteItem', 'markFavoriteItem'],
	] as const)('setFavorite(%s) calls %s only', async (desired, called, notCalled) => {
		await setFavorite(api, 'user-1', 'item-1', desired);

		expect(userLibraryApi[called]).toHaveBeenCalledWith({ itemId: 'item-1', userId: 'user-1' });
		expect(userLibraryApi[notCalled]).not.toHaveBeenCalled();
	});

	it.each([
		[true, 'markPlayedItem', 'markUnplayedItem'],
		[false, 'markUnplayedItem', 'markPlayedItem'],
	] as const)('setWatched(%s) calls %s only', async (desired, called, notCalled) => {
		await setWatched(api, 'user-1', 'item-1', desired);

		expect(playstateApi[called]).toHaveBeenCalledWith({ itemId: 'item-1', userId: 'user-1' });
		expect(playstateApi[notCalled]).not.toHaveBeenCalled();
	});

	it("returns the server's updated user data so the UI can reconcile", async () => {
		await expect(setFavorite(api, 'user-1', 'item-1', true)).resolves.toEqual(userData);
		await expect(setWatched(api, 'user-1', 'item-1', true)).resolves.toEqual(userData);
	});
});

describe('image URLs', () => {
	let backdrops: string[];
	let imageApi: Record<
		'getItemImageUrl' | 'getItemBackdropImageUrls' | 'getItemImageUrlById',
		ReturnType<typeof vi.fn>
	>;

	beforeEach(() => {
		backdrops = [];
		imageApi = {
			getItemImageUrl: vi.fn((_item, type: string) => `${type.toLowerCase()}-url`),
			getItemBackdropImageUrls: vi.fn(() => backdrops),
			getItemImageUrlById: vi.fn((id: string, type: string) => `${id}-${type.toLowerCase()}-url`),
		};
		vi.mocked(getImageApi).mockReturnValue(imageApi as never);
	});

	describe('getLandscapeImageUrl', () => {
		it("uses an episode's own still, even when it has a thumb", () => {
			backdrops = ['backdrop-url'];
			const episode = makeItem({ Type: 'Episode', ImageTags: { Thumb: 't' } });

			expect(getLandscapeImageUrl(api, episode)).toBe('primary-url');
		});

		it('prefers the thumb artwork over a backdrop', () => {
			backdrops = ['backdrop-url'];

			expect(getLandscapeImageUrl(api, makeItem({ ImageTags: { Thumb: 't' } }))).toBe('thumb-url');
		});

		it('falls back to the first backdrop when there is no thumb', () => {
			backdrops = ['backdrop-url', 'second-backdrop-url'];

			expect(getLandscapeImageUrl(api, makeItem())).toBe('backdrop-url');
		});

		it('falls back to the poster when there is no landscape artwork at all', () => {
			expect(getLandscapeImageUrl(api, makeItem())).toBe('primary-url');
		});
	});

	describe('getLogoUrl', () => {
		it('returns nothing for an item without a logo, so the title text is shown', () => {
			expect(getLogoUrl(api, makeItem({ ImageTags: {} }))).toBeUndefined();
			expect(getLogoUrl(api, makeItem({ ImageTags: undefined }))).toBeUndefined();
			expect(imageApi.getItemImageUrl).not.toHaveBeenCalled();
		});

		it('returns the logo URL when the item has one', () => {
			expect(getLogoUrl(api, makeItem({ ImageTags: { Logo: 'l' } }))).toBe('logo-url');
		});
	});

	describe('getPersonImageUrl', () => {
		it.each([
			['no photo', { Id: 'p1', Name: 'Keanu Reeves' }],
			['no id', { Name: 'Keanu Reeves', PrimaryImageTag: 'tag' }],
		])('returns nothing for a cast member with %s, so initials are shown', (_, person) => {
			expect(getPersonImageUrl(api, person)).toBeUndefined();
		});

		it('requests the photo by person id with its tag so the image is cached per version', () => {
			const url = getPersonImageUrl(api, { Id: 'p1', PrimaryImageTag: 'tag-7' });

			expect(url).toBe('p1-primary-url');
			expect(imageApi.getItemImageUrlById).toHaveBeenCalledWith('p1', 'Primary', { tag: 'tag-7' });
		});
	});
});
