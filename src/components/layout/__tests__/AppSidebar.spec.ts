import AppSidebar from '@/components/layout/AppSidebar.vue';
import { useLibraries } from '@/composables/jellyfin/useLibraries';
import { useNavDrawer } from '@/composables/ui/useNavDrawer';
import { makeItem } from '@/test/fixtures/jellyfin';
import { renderAt } from '@/test/router';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/jellyfin/library');

beforeEach(() => {
	useNavDrawer().close();
	useLibraries().libraries.value = [
		makeItem({ Id: 'lib-movies', Name: 'Movies', CollectionType: 'movies' }),
		makeItem({ Id: 'lib-shows', Name: 'Shows', CollectionType: 'tvshows' }),
	];
});

describe('AppSidebar', () => {
	it('links to every library by name', async () => {
		await renderAt(AppSidebar, '/');

		expect(screen.getByRole('link', { name: 'Movies' })).toHaveAttribute(
			'href',
			'/library/lib-movies',
		);
		expect(screen.getByRole('link', { name: 'Shows' })).toHaveAttribute(
			'href',
			'/library/lib-shows',
		);
	});

	it('says so when the server has no libraries', async () => {
		useLibraries().libraries.value = [];

		await renderAt(AppSidebar, '/');

		expect(screen.getByText('No libraries yet')).toBeInTheDocument();
	});

	it('marks Home as current only on the home page itself', async () => {
		const { router } = await renderAt(AppSidebar, '/');
		const home = screen.getByRole('link', { name: 'Home' });
		expect(home).toHaveClass('router-link-active');

		await router.push('/library/lib-movies');

		await vi.waitFor(() => expect(home).not.toHaveClass('router-link-active'));
		expect(screen.getByRole('link', { name: 'Movies' })).toHaveClass('router-link-active');
	});

	it('closes the drawer after navigating somewhere', async () => {
		const { router } = await renderAt(AppSidebar, '/');
		useNavDrawer().open();

		await router.push('/library/lib-shows');

		await vi.waitFor(() => expect(useNavDrawer().isOpen.value).toBe(false));
	});

	it('closes the drawer with its Close button', async () => {
		await renderAt(AppSidebar, '/');
		useNavDrawer().open();

		await userEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(useNavDrawer().isOpen.value).toBe(false);
	});
});
