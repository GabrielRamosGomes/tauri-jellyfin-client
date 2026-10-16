import ExternalLinks from '@/components/features/item-detail/ExternalLinks.vue';
import { openUrl } from '@tauri-apps/plugin-opener';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }));

const links = [
	{ Name: 'IMDb', Url: 'https://www.imdb.com/title/tt0133093' },
	{ Name: 'TheMovieDb', Url: 'https://www.themoviedb.org/movie/603' },
];

describe('ExternalLinks', () => {
	it('opens each link in the system browser', async () => {
		render(ExternalLinks, { props: { links } });

		await userEvent.click(screen.getByRole('button', { name: 'TheMovieDb' }));

		expect(openUrl).toHaveBeenCalledExactlyOnceWith('https://www.themoviedb.org/movie/603');
	});

	it.each([
		['no links', []],
		['links nulled by the server', null],
		['an item without the field at all', undefined],
	])('renders nothing, and warns about nothing, for %s', (_, value) => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(ExternalLinks, { props: { links: value } });

		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(warn).not.toHaveBeenCalled();
	});
});
