import type { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getChildItems } from '@/api/jellyfin/library';
import SeasonHeader from '@/components/features/item-detail/SeasonHeader.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import { TICKS_PER_MINUTE } from '@/utils/format';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const season = makeItem({
	Id: 'season-2',
	Name: 'Season 2',
	Type: 'Season',
	IndexNumber: 2,
	SeriesId: 'series-1',
	SeriesName: 'Severance',
});

const episode = (index: number, UserData: UserItemDataDto = {}) =>
	makeItem({
		Id: `s2e${index}`,
		Name: `Episode ${index}`,
		Type: 'Episode',
		IndexNumber: index,
		ParentIndexNumber: 2,
		RunTimeTicks: 45 * TICKS_PER_MINUTE,
		UserData,
	});

const watched = { Played: true };
const inProgress = { Played: false, PlaybackPositionTicks: 10 * TICKS_PER_MINUTE };

function renderSeason(episodes: BaseItemDto[], item = season) {
	return renderAt(SeasonHeader, `/item/${item.Id}`, { props: { item, episodes } });
}

beforeEach(() => {
	signOut();
	signIn();
	vi.mocked(getChildItems).mockResolvedValue([
		makeItem({ Id: 'season-1', Name: 'Season 1', Type: 'Season' }),
		season,
		makeItem({ Id: 'season-3', Name: 'Season 3', Type: 'Season' }),
	]);
});

describe('SeasonHeader', () => {
	it('summarises the season: episode count, total runtime and watched progress', async () => {
		await renderSeason([episode(1, watched), episode(2), episode(3)]);

		expect(screen.getByText('3 episodes')).toBeInTheDocument();
		expect(screen.getByText('2h 15m')).toBeInTheDocument();
		expect(screen.getByText('1 / 3 watched')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
	});

	it.each([
		['nothing is watched yet', 'Play', 's2e1', [episode(1), episode(2), episode(3)]],
		[
			'earlier episodes are watched',
			'Resume S2:E2',
			's2e2',
			[episode(1, watched), episode(2), episode(3)],
		],
		[
			'an episode is part-way through',
			'Resume S2:E3',
			's2e3',
			[episode(1, watched), episode(2), episode(3, inProgress)],
		],
		['the whole season is watched', 'Play', 's2e1', [episode(1, watched), episode(2, watched)]],
	])('when %s, offers "%s" and opens %s', async (_, label, target, episodes) => {
		const { router } = await renderSeason(episodes);

		await userEvent.click(screen.getByRole('button', { name: label }));

		await vi.waitFor(() => expect(router.currentRoute.value.params.id).toBe(target));
	});

	it('steps to the neighbouring seasons of the same series', async () => {
		await renderSeason([episode(1)]);

		expect(await screen.findByRole('link', { name: 'Go to Season 1' })).toHaveAttribute(
			'href',
			'/item/season-1',
		);
		expect(screen.getByRole('link', { name: 'Go to Season 3' })).toHaveAttribute(
			'href',
			'/item/season-3',
		);
		expect(getChildItems).toHaveBeenCalledWith(
			expect.anything(),
			'user-1',
			'series-1',
			expect.anything(),
		);
	});

	it('has no way back from the first season', async () => {
		const first = makeItem({ ...season, Id: 'season-1', Name: 'Season 1', IndexNumber: 1 });

		await renderSeason([episode(1)], first);

		expect(await screen.findByRole('link', { name: 'Go to Season 2' })).toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /Go to Season/ })).toHaveLength(1);
	});

	it('links back to the series', async () => {
		await renderSeason([episode(1)]);

		expect(screen.getByRole('link', { name: 'Severance' })).toHaveAttribute(
			'href',
			'/item/series-1',
		);
	});
});
