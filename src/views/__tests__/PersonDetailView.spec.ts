import { getItemDetail, getItemsByPerson } from '@/api/jellyfin/library';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import PersonDetailView from '@/views/PersonDetailView.vue';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

beforeEach(() => {
	signOut();
	signIn();
});

describe('PersonDetailView', () => {
	it('shows the person and their filmography grouped by type', async () => {
		vi.mocked(getItemDetail).mockResolvedValue(
			makeItem({
				Id: 'p-andrew',
				Name: 'Andrew Garfield',
				Type: 'Person',
				Overview: 'British-American actor.',
			}),
		);
		vi.mocked(getItemsByPerson).mockResolvedValue([
			makeItem({ Id: 'm1', Name: 'Hacksaw Ridge', Type: 'Movie' }),
			makeItem({ Id: 's1', Name: 'Under the Banner of Heaven', Type: 'Series' }),
		]);

		await renderAt(PersonDetailView, '/person/p-andrew');

		expect(await screen.findByRole('heading', { name: 'Andrew Garfield' })).toBeInTheDocument();
		expect(screen.getByText('British-American actor.')).toBeInTheDocument();
		expect(await screen.findByRole('tab', { name: 'Movies' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'TV Shows' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Hacksaw Ridge/ })).toBeInTheDocument();
	});

	it('shows why the person could not be loaded', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(getItemDetail).mockRejectedValue(new Error('Item not found'));
		vi.mocked(getItemsByPerson).mockResolvedValue([]);

		await renderAt(PersonDetailView, '/person/missing');

		expect(await screen.findByText('Item not found')).toBeInTheDocument();
	});
});
