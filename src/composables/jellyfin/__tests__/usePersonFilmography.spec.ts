import { getItemsByPerson } from '@/api/jellyfin/library';
import { usePersonFilmography } from '@/composables/jellyfin/usePersonFilmography';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { withScope } from '@/test/utils';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/library');

beforeEach(() => {
	signOut();
	signIn();
});

describe('usePersonFilmography', () => {
	it('groups credits by media type in a fixed order, hiding empty groups', async () => {
		vi.mocked(getItemsByPerson).mockResolvedValue([
			makeItem({ Id: 'ep', Type: 'Episode' }),
			makeItem({ Id: 'show', Type: 'Series' }),
			makeItem({ Id: 'movie-1', Type: 'Movie' }),
			makeItem({ Id: 'movie-2', Type: 'Movie' }),
		]);

		const [{ groups }] = withScope(() => usePersonFilmography(ref('person-1')));
		await flushPromises();

		expect(
			groups.value.map(({ label, items }) => ({ label, ids: items.map((item) => item.Id) })),
		).toEqual([
			{ label: 'Movies', ids: ['movie-1', 'movie-2'] },
			{ label: 'TV Shows', ids: ['show'] },
			{ label: 'Episodes', ids: ['ep'] },
		]);
	});

	it('leaves out credits of types the page has no section for', async () => {
		vi.mocked(getItemsByPerson).mockResolvedValue([
			makeItem({ Type: 'MusicVideo' }),
			makeItem({ Type: undefined }),
		]);

		const [{ groups }] = withScope(() => usePersonFilmography(ref('person-1')));
		await flushPromises();

		expect(groups.value).toEqual([]);
	});

	it('does not request anything without a person id', async () => {
		withScope(() => usePersonFilmography(ref('')));
		await flushPromises();

		expect(getItemsByPerson).not.toHaveBeenCalled();
	});
});
