import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getChildItems } from '@/api/jellyfin/library';
import EpisodeHeader from '@/components/features/item-detail/EpisodeHeader.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const episode = (index: number, overrides: Partial<BaseItemDto> = {}) =>
	makeItem({
		Id: `s1e${index}`,
		Name: ['Good News About Hell', 'Half Loop', 'In Perpetuity'][index - 1],
		Type: 'Episode',
		IndexNumber: index,
		ParentIndexNumber: 1,
		SeasonId: 'season-1',
		SeriesId: 'series-1',
		SeriesName: 'Severance',
		...overrides,
	});

const season = [episode(1), episode(2), episode(3)];

function renderEpisode(item: BaseItemDto) {
	return renderAt(EpisodeHeader, `/item/${item.Id}`, { props: { item } });
}

beforeEach(() => {
	signOut();
	signIn();
	vi.mocked(getChildItems).mockResolvedValue(season);
});

describe('EpisodeHeader', () => {
	it('titles the episode with its season and episode number', async () => {
		await renderEpisode(episode(2));

		expect(screen.getByRole('heading', { name: 'S1:E2 · Half Loop' })).toBeInTheDocument();
	});

	it('titles an episode without numbering by its name alone', async () => {
		await renderEpisode(episode(2, { IndexNumber: null }));

		expect(screen.getByRole('heading', { name: 'Half Loop' })).toBeInTheDocument();
	});

	it('steps to the previous and next episode of the season', async () => {
		await renderEpisode(episode(2));

		expect(await screen.findByRole('link', { name: 'Go to Good News About Hell' })).toHaveAttribute(
			'href',
			'/item/s1e1',
		);
		expect(screen.getByRole('link', { name: 'Go to In Perpetuity' })).toHaveAttribute(
			'href',
			'/item/s1e3',
		);
		expect(getChildItems).toHaveBeenCalledWith(
			expect.anything(),
			'user-1',
			'season-1',
			expect.anything(),
		);
	});

	it('has nowhere to go after the last episode', async () => {
		await renderEpisode(episode(3));

		expect(await screen.findByRole('link', { name: 'Go to Half Loop' })).toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /^Go to/ })).toHaveLength(1);
	});

	it('links back to the series', async () => {
		await renderEpisode(episode(1));

		expect(screen.getByRole('link', { name: 'Severance' })).toHaveAttribute(
			'href',
			'/item/series-1',
		);
	});

	it('lets the user pick audio and subtitle tracks when the episode has them', async () => {
		await renderEpisode(
			episode(1, {
				MediaStreams: [
					{ Type: MediaStreamType.Audio, Index: 1, DisplayTitle: 'English - AAC' },
					{ Type: MediaStreamType.Subtitle, Index: 2, DisplayTitle: 'English - SRT' },
				],
			}),
		);

		expect(screen.getByRole('combobox', { name: 'Audio track' })).toBeInTheDocument();
		expect(screen.getByRole('combobox', { name: 'Subtitles' })).toBeInTheDocument();
	});
});
