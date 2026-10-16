import { getChildItems, getItemDetail } from '@/api/jellyfin/library';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import ItemDetailView from '@/views/ItemDetailView.vue';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

beforeEach(() => {
	signOut();
	signIn();
	vi.mocked(getChildItems).mockResolvedValue([]);
});

describe('ItemDetailView', () => {
	it('shows a movie with its details and cast', async () => {
		vi.mocked(getItemDetail).mockResolvedValue(
			makeItem({
				Id: 'movie-1',
				Name: 'The Social Network',
				Type: 'Movie',
				ProductionYear: 2010,
				Overview: 'Harvard, 2003.',
				People: [{ Id: 'p1', Name: 'Jesse Eisenberg', Role: 'Mark', Type: PersonKind.Actor }],
			}),
		);

		await renderAt(ItemDetailView, '/item/movie-1');

		expect(await screen.findByRole('heading', { name: 'The Social Network' })).toBeInTheDocument();
		expect(screen.getByText('Harvard, 2003.')).toBeInTheDocument();
		expect(screen.getByText('Jesse Eisenberg')).toBeInTheDocument();
		expect(getItemDetail).toHaveBeenCalledWith(expect.anything(), 'user-1', 'movie-1');
	});

	it("lists a season's episodes from a single request shared with its header", async () => {
		vi.mocked(getItemDetail).mockResolvedValue(
			makeItem({
				Id: 'season-1',
				Name: 'Season 1',
				Type: 'Season',
				IndexNumber: 1,
				SeriesId: 'series-1',
			}),
		);
		vi.mocked(getChildItems).mockImplementation(async (_api, _user, parentId) =>
			parentId === 'season-1'
				? [
						makeItem({
							Id: 'e1',
							Name: 'Pilot',
							Type: 'Episode',
							IndexNumber: 1,
							ParentIndexNumber: 1,
						}),
						makeItem({
							Id: 'e2',
							Name: 'Second',
							Type: 'Episode',
							IndexNumber: 2,
							ParentIndexNumber: 1,
						}),
					]
				: [],
		);

		await renderAt(ItemDetailView, '/item/season-1');

		expect(await screen.findByText('2 episodes')).toBeInTheDocument();
		expect(screen.getAllByText(/Pilot/).length).toBeGreaterThan(0);
		const seasonRequests = vi
			.mocked(getChildItems)
			.mock.calls.filter(([, , id]) => id === 'season-1');
		expect(seasonRequests).toHaveLength(1);
	});

	it('loads the new item when the route changes to another one', async () => {
		vi.mocked(getItemDetail).mockImplementation(async (_api, _user, id) =>
			makeItem({ Id: id, Name: id === 'movie-1' ? 'Heat' : 'Ronin', Type: 'Movie' }),
		);
		const { router } = await renderAt(ItemDetailView, '/item/movie-1');
		await screen.findByRole('heading', { name: 'Heat' });

		await router.push('/item/movie-2');

		expect(await screen.findByRole('heading', { name: 'Ronin' })).toBeInTheDocument();
	});

	it('shows why the item could not be loaded', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(getItemDetail).mockRejectedValue(new Error('Item not found'));

		await renderAt(ItemDetailView, '/item/missing');

		expect(await screen.findByText('Item not found')).toBeInTheDocument();
	});
});
