import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getChildItems } from '@/api/jellyfin/library';
import { useSeasonEpisodes } from '@/composables/jellyfin/useSeasonEpisodes';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { withScope } from '@/test/utils';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/library');

function episode(id: string, IndexNumber?: number | null, ParentIndexNumber?: number | null) {
	return makeItem({ Id: id, Type: 'Episode', IndexNumber, ParentIndexNumber });
}

async function episodesOf(children: BaseItemDto[], seasonNumber?: number) {
	vi.mocked(getChildItems).mockResolvedValue(children);
	const [{ episodes }] = withScope(() => useSeasonEpisodes(ref('season-1'), ref(seasonNumber)));
	await flushPromises();
	return episodes.value.map((item) => item.Id);
}

beforeEach(() => {
	signOut();
	signIn();
});

describe('useSeasonEpisodes', () => {
	it('lists the episodes in the order the server returned them', async () => {
		const ids = await episodesOf([episode('e1', 1, 1), episode('e2', 2, 1)], 1);

		expect(ids).toEqual(['e1', 'e2']);
	});

	it('leaves out children that are not episodes', async () => {
		const ids = await episodesOf(
			[episode('e1', 1, 1), makeItem({ Id: 'extra', Type: 'Video' })],
			1,
		);

		expect(ids).toEqual(['e1']);
	});

	it('leaves out episodes that belong to a different season', async () => {
		const ids = await episodesOf([episode('e1', 1, 1), episode('s2e1', 1, 2)], 1);

		expect(ids).toEqual(['e1']);
	});

	it('keeps episodes whose season number is unknown', async () => {
		const ids = await episodesOf([episode('e1', 1, null), episode('e2', 2, undefined)], 1);

		expect(ids).toEqual(['e1', 'e2']);
	});

	it('matches specials in season 0', async () => {
		const ids = await episodesOf([episode('special', 1, 0), episode('regular', 1, 1)], 0);

		expect(ids).toEqual(['special']);
	});

	it('shows every season when the season number is unknown', async () => {
		const ids = await episodesOf([episode('s1e1', 1, 1), episode('s2e2', 2, 2)], undefined);

		expect(ids).toEqual(['s1e1', 's2e2']);
	});

	it('shows an episode once when the server has several versions of it', async () => {
		const ids = await episodesOf(
			[episode('e1-1080p', 1, 1), episode('e1-4k', 1, 1), episode('e2', 2, 1)],
			1,
		);

		expect(ids).toEqual(['e1-1080p', 'e2']);
	});

	it('leaves out episodes without an episode number', async () => {
		const ids = await episodesOf([episode('e1', 1, 1), episode('unnumbered', null, 1)], 1);

		expect(ids).toEqual(['e1']);
	});
});
