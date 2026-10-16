import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import {
	getContinueWatching,
	getFavorites,
	getLatestMedia,
	getNextUp,
} from '@/api/jellyfin/library';
import { useHomeSections } from '@/composables/jellyfin/useHomeSections';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred } from '@/test/utils';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const home = useHomeSections();
const movies = makeItem({ Id: 'lib-movies', Name: 'Movies', Type: 'CollectionFolder' });
const shows = makeItem({ Id: 'lib-shows', Name: 'Shows', Type: 'CollectionFolder' });

beforeEach(() => {
	signOut();
	signIn();
	home.favorites.value = [];
	home.continueWatching.value = [];
	home.nextUp.value = [];
	home.latestByLibrary.value = [];
	home.errorMessage.value = '';
	vi.mocked(getFavorites).mockResolvedValue([]);
	vi.mocked(getContinueWatching).mockResolvedValue([]);
	vi.mocked(getNextUp).mockResolvedValue([]);
	vi.mocked(getLatestMedia).mockResolvedValue([]);
});

describe('refreshUserSections', () => {
	it('loads favorites, continue watching and next up', async () => {
		const favorite = makeItem({ Id: 'fav' });
		const resume = makeItem({ Id: 'resume' });
		const next = makeItem({ Id: 'next', Type: 'Episode' });
		vi.mocked(getFavorites).mockResolvedValue([favorite]);
		vi.mocked(getContinueWatching).mockResolvedValue([resume]);
		vi.mocked(getNextUp).mockResolvedValue([next]);

		await home.refreshUserSections();

		expect(home.favorites.value).toEqual([favorite]);
		expect(home.continueWatching.value).toEqual([resume]);
		expect(home.nextUp.value).toEqual([next]);
	});

	it('still fills the rows that loaded when another row fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const resume = makeItem({ Id: 'resume' });
		vi.mocked(getFavorites).mockRejectedValue(new Error('Server returned 500'));
		vi.mocked(getContinueWatching).mockResolvedValue([resume]);

		await home.refreshUserSections();
		await flushPromises();

		expect(home.errorMessage.value).toBe('Server returned 500');
		expect(home.continueWatching.value).toEqual([resume]);
	});

	it('does nothing while signed out', async () => {
		signOut();

		await home.refreshUserSections();

		expect(getFavorites).not.toHaveBeenCalled();
	});
});

describe('refreshLibrarySections', () => {
	it('builds one "latest" row per library, named after it', async () => {
		vi.mocked(getLatestMedia).mockImplementation(async (_api, _user, libraryId) => [
			makeItem({ Id: `${libraryId}-latest` }),
		]);

		await home.refreshLibrarySections([movies, shows]);

		const rows = home.latestByLibrary.value.map(({ libraryName, items }) => ({
			libraryName,
			ids: items.map((item) => item.Id),
		}));
		expect(rows).toEqual(
			expect.arrayContaining([
				{ libraryName: 'Movies', ids: ['lib-movies-latest'] },
				{ libraryName: 'Shows', ids: ['lib-shows-latest'] },
			]),
		);
	});

	it('skips libraries without an id', async () => {
		await home.refreshLibrarySections([movies, makeItem({ Id: undefined, Name: 'Broken' })]);

		expect(getLatestMedia).toHaveBeenCalledTimes(1);
		expect(home.latestByLibrary.value.map((row) => row.libraryName)).toEqual(['Movies']);
	});

	it('replaces a library row on refresh instead of adding a duplicate', async () => {
		await home.refreshLibrarySections([movies]);
		vi.mocked(getLatestMedia).mockResolvedValue([makeItem({ Id: 'newer' })]);

		await home.refreshLibrarySections([movies]);

		expect(home.latestByLibrary.value).toHaveLength(1);
		expect(home.latestByLibrary.value[0].items.map((item) => item.Id)).toEqual(['newer']);
	});
});

it('stays loading until both the user rows and the library rows have finished', async () => {
	const favorites = deferred<BaseItemDto[]>();
	const latest = deferred<BaseItemDto[]>();
	vi.mocked(getFavorites).mockReturnValue(favorites.promise);
	vi.mocked(getLatestMedia).mockReturnValue(latest.promise);

	const userRows = home.refreshUserSections();
	const libraryRows = home.refreshLibrarySections([movies]);

	favorites.resolve([]);
	await userRows;
	expect(home.loading.value).toBe(true);

	latest.resolve([]);
	await libraryRows;
	expect(home.loading.value).toBe(false);
});

describe('heroItem', () => {
	it('features the first item to continue watching', async () => {
		const resume = makeItem({ Id: 'resume' });
		vi.mocked(getContinueWatching).mockResolvedValue([resume, makeItem({ Id: 'other' })]);
		vi.mocked(getLatestMedia).mockResolvedValue([makeItem({ Id: 'latest' })]);

		await home.refreshUserSections();
		await home.refreshLibrarySections([movies]);

		expect(home.heroItem.value).toEqual(resume);
	});

	it('otherwise features the newest item that has not been watched yet', async () => {
		vi.mocked(getLatestMedia).mockResolvedValue([
			makeItem({ Id: 'seen', UserData: { Played: true } }),
			makeItem({ Id: 'unseen', UserData: { Played: false } }),
		]);

		await home.refreshLibrarySections([movies]);

		expect(home.heroItem.value?.Id).toBe('unseen');
	});

	it('features nothing when everything recent has been watched', async () => {
		vi.mocked(getLatestMedia).mockResolvedValue([makeItem({ UserData: { Played: true } })]);

		await home.refreshLibrarySections([movies]);

		expect(home.heroItem.value).toBeUndefined();
	});
});
