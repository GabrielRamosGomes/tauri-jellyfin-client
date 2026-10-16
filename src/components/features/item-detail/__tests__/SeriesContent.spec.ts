import { getChildItems, getNextUp } from '@/api/jellyfin/library';
import SeriesContent from '@/components/features/item-detail/SeriesContent.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const series = makeItem({ Id: 'series-1', Name: 'Severance', Type: 'Series' });
const seasons = [
	makeItem({ Id: 'season-1', Name: 'Season 1', Type: 'Season' }),
	makeItem({ Id: 'season-2', Name: 'Season 2', Type: 'Season' }),
];

const renderSeries = () => renderAt(SeriesContent, '/item/series-1', { props: { item: series } });

beforeEach(() => {
	signOut();
	signIn();
	vi.mocked(getChildItems).mockResolvedValue(seasons);
	vi.mocked(getNextUp).mockResolvedValue([]);
});

describe('SeriesContent', () => {
	it("shows the next episode to watch next to the series' seasons", async () => {
		vi.mocked(getNextUp).mockResolvedValue([
			makeItem({ Id: 's2e4', Name: `Woe's Hollow`, Type: 'Episode', SeriesName: 'Severance' }),
		]);

		await renderSeries();

		expect(await screen.findByRole('heading', { name: 'Next Up' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Woe's Hollow/ })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Seasons' })).toBeInTheDocument();
		expect(getNextUp).toHaveBeenCalledWith(expect.anything(), 'user-1', 'series-1');
	});

	it('shows just the seasons once the series is finished', async () => {
		await renderSeries();

		expect(await screen.findByRole('link', { name: /Season 2/ })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Next Up' })).not.toBeInTheDocument();
	});

	it('says so when the series has no seasons yet', async () => {
		vi.mocked(getChildItems).mockResolvedValue([]);

		await renderSeries();

		expect(await screen.findByText('No seasons yet')).toBeInTheDocument();
	});
});
