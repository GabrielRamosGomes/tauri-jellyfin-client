import AppHeader from '@/components/layout/AppHeader.vue';
import { useNavDrawer } from '@/composables/ui/useNavDrawer';
import { renderAt } from '@/test/router';
import { signOut } from '@/test/session';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));
vi.mock('@/api/jellyfin/jellyfin');
vi.mock('@/api/jellyfin/library');

beforeEach(() => {
	signOut();
	useNavDrawer().close();
});

describe('AppHeader', () => {
	it('opens and closes the navigation drawer from the menu button', async () => {
		await renderAt(AppHeader, '/');

		await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
		expect(useNavDrawer().isOpen.value).toBe(true);

		await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
		expect(useNavDrawer().isOpen.value).toBe(false);
	});

	it('goes back to the previous page', async () => {
		const { router } = await renderAt(AppHeader, '/');
		await router.push('/settings');

		await userEvent.click(screen.getByRole('button', { name: 'Back' }));

		await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
	});

	it('has a named link home', async () => {
		await renderAt(AppHeader, '/settings');

		expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
	});
});
