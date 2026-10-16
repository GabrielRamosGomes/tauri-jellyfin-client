import { getLibraryGenres, getLibraryItems } from '@/api/jellyfin/library';
import { useLibraries } from '@/composables/jellyfin/useLibraries';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import LibraryView from '@/views/LibraryView.vue';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

const page = (names: string[], total = names.length) => ({
	items: names.map((Name, index) => makeItem({ Id: `${Name}-${index}`, Name })),
	total,
});

const requests = () =>
	vi
		.mocked(getLibraryItems)
		.mock.calls.map(([, , libraryId, query]) => Object.assign({ libraryId }, query));
const lastRequest = () => requests()[requests().length - 1];

async function pickLetter(letter: string) {
	const rail = await screen.findByRole('group', { name: 'Filter by letter' });
	await userEvent.click(within(rail).getByRole('button', { name: letter }));
}

beforeEach(() => {
	signOut();
	signIn();
	window.scrollTo = vi.fn();
	useLibraries().libraries.value = [
		makeItem({ Id: 'lib-movies', Name: 'Movies' }),
		makeItem({ Id: 'lib-shows', Name: 'Shows' }),
	];
	vi.mocked(getLibraryGenres).mockResolvedValue([]);
	vi.mocked(getLibraryItems).mockResolvedValue(page(['Alien', 'Blade Runner'], 250));
});

describe('LibraryView', () => {
	it('shows the library by name with its total and items', async () => {
		await renderAt(LibraryView, '/library/lib-movies');

		expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument();
		expect(await screen.findByRole('link', { name: /Blade Runner/ })).toBeInTheDocument();
		expect(screen.getByText('250')).toBeInTheDocument();
	});

	it('explains an empty library without offering to clear filters', async () => {
		vi.mocked(getLibraryItems).mockResolvedValue(page([]));

		await renderAt(LibraryView, '/library/lib-movies');

		expect(await screen.findByText('This library is empty')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
	});

	it('explains a filtered dead end, and clearing the filters shows everything again', async () => {
		await renderAt(LibraryView, '/library/lib-movies');
		await screen.findByRole('link', { name: /Alien/ });
		vi.mocked(getLibraryItems).mockResolvedValueOnce(page([]));

		await pickLetter('Z');
		expect(await screen.findByText('No titles under Z')).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

		expect(await screen.findByRole('link', { name: /Alien/ })).toBeInTheDocument();
		expect(lastRequest()?.nameFilter).toEqual({});
	});

	it('opens another library unfiltered, with a single request', async () => {
		const { router } = await renderAt(LibraryView, '/library/lib-movies');
		await pickLetter('B');
		vi.mocked(getLibraryItems).mockClear();

		await router.push('/library/lib-shows');

		await vi.waitFor(() =>
			expect(screen.getByRole('heading', { name: 'Shows' })).toBeInTheDocument(),
		);
		expect(requests()).toEqual([
			expect.objectContaining({ libraryId: 'lib-shows', nameFilter: {} }),
		]);
	});

	it('hides the alphabet rail when not sorting by name, dropping its filter', async () => {
		await renderAt(LibraryView, '/library/lib-movies');
		await pickLetter('B');

		await userEvent.click(screen.getByRole('combobox', { name: 'Sort by' }));
		await userEvent.click(screen.getByRole('option', { name: 'Rating' }));

		expect(screen.queryByRole('group', { name: 'Filter by letter' })).not.toBeInTheDocument();
		await vi.waitFor(() => expect(lastRequest()?.nameFilter).toEqual({}));
	});

	it('shows why the library could not be loaded', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(getLibraryItems).mockRejectedValue(new Error('Server returned 500'));

		await renderAt(LibraryView, '/library/lib-movies');

		expect(await screen.findByText('Server returned 500')).toBeInTheDocument();
	});
});
