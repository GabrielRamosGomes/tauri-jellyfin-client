import {
	getContinueWatching,
	getFavorites,
	getLatestMedia,
	getNextUp,
} from '@/api/jellyfin/library';
import { useHomeSections } from '@/composables/jellyfin/useHomeSections';
import { useLibraries } from '@/composables/jellyfin/useLibraries';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import HomeView from '@/views/HomeView.vue';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const movies = makeItem({ Id: 'lib-movies', Name: 'Movies', Type: 'CollectionFolder' });

beforeEach(() => {
	signOut();
	signIn();
	const home = useHomeSections();
	home.favorites.value = [];
	home.continueWatching.value = [];
	home.nextUp.value = [];
	home.latestByLibrary.value = [];
	useLibraries().libraries.value = [movies];
	vi.mocked(getFavorites).mockResolvedValue([]);
	vi.mocked(getContinueWatching).mockResolvedValue([]);
	vi.mocked(getNextUp).mockResolvedValue([]);
	vi.mocked(getLatestMedia).mockResolvedValue([]);
});

describe('HomeView', () => {
	it('shows the collection, up next, continue watching and the latest of each library', async () => {
		vi.mocked(getNextUp).mockResolvedValue([
			makeItem({ Id: 'next', Name: 'Pilot', Type: 'Episode' }),
		]);
		vi.mocked(getContinueWatching).mockResolvedValue([makeItem({ Id: 'resume', Name: 'Heat' })]);
		vi.mocked(getLatestMedia).mockResolvedValue([makeItem({ Id: 'new', Name: 'Dune' })]);

		await renderAt(HomeView, '/');

		expect(await screen.findByRole('heading', { name: 'Latest Movies' })).toBeInTheDocument();
		for (const row of ['My Collection', 'Up Next', 'Continue Watching']) {
			expect(screen.getByRole('heading', { name: row })).toBeInTheDocument();
		}
		expect(getLatestMedia).toHaveBeenCalledWith(expect.anything(), 'user-1', 'lib-movies');
	});

	it('features what you were watching, offering to resume it', async () => {
		vi.mocked(getContinueWatching).mockResolvedValue([
			makeItem({ Id: 'resume', Name: 'Heat', UserData: { PlayedPercentage: 42 } }),
		]);

		await renderAt(HomeView, '/');

		expect(await screen.findByRole('heading', { level: 1, name: 'Heat' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Resume/ })).toBeInTheDocument();
	});

	it('leaves out rows that have nothing in them', async () => {
		await renderAt(HomeView, '/');

		expect(await screen.findByRole('heading', { name: 'My Collection' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Continue Watching' })).not.toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Up Next' })).not.toBeInTheDocument();
	});

	it('invites adding a library when the server has none', async () => {
		useLibraries().libraries.value = [];

		await renderAt(HomeView, '/');

		expect(await screen.findByText('No libraries yet')).toBeInTheDocument();
		expect(getLatestMedia).not.toHaveBeenCalled();
	});
});
