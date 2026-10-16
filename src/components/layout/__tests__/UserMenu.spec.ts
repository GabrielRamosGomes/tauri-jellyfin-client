import { authStorage } from '@/api/storage/auth';
import UserMenu from '@/components/layout/UserMenu.vue';
import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
import { makeSession } from '@/test/fixtures/jellyfin';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { resetFakeStores } from '@/test/mocks/tauri-store';
import { renderAt } from '@/test/router';
import { signIn, signOut } from '@/test/session';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));
vi.mock('@/api/jellyfin/jellyfin');
vi.mock('@/api/jellyfin/library');

const session = makeSession({ username: 'neo' });

async function openMenu() {
	await userEvent.click(screen.getByRole('button', { name: 'Account' }));
	return screen.findByRole('menu');
}

beforeEach(async () => {
	resetFakeStores();
	mockKeychain();
	signOut();
	await authStorage.saveSession(session);
	signIn(session);
});

describe('UserMenu', () => {
	it("shows the signed-in user's initial when there is no avatar", async () => {
		await renderAt(UserMenu, '/');

		expect(screen.getByRole('button', { name: 'Account' })).toHaveTextContent('N');
	});

	it('is hidden while nobody is signed in', async () => {
		signOut();

		await renderAt(UserMenu, '/');

		expect(screen.queryByRole('button', { name: 'Account' })).not.toBeInTheDocument();
	});

	it('signs out and asks for credentials again on the same server', async () => {
		const { router } = await renderAt(UserMenu, '/');
		await openMenu();

		await userEvent.click(screen.getByRole('menuitem', { name: 'Sign Out' }));

		await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
		expect(router.currentRoute.value.query.mode).toBe('signout');
		expect(useAuthSession().session.value).toBeNull();
		await expect(authStorage.listSessions()).resolves.toHaveLength(1);
	});

	it.each([
		['Settings', 'settings'],
		['Change Server', 'login'],
	])('"%s" opens the %s page without signing out', async (item, routeName) => {
		const { router } = await renderAt(UserMenu, '/');
		await openMenu();

		await userEvent.click(screen.getByRole('menuitem', { name: item }));

		await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(routeName));
		expect(router.currentRoute.value.query.mode).toBeUndefined();
		expect(useAuthSession().session.value).toEqual(session);
	});
});
