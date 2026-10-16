import type { AuthenticatedSession, ConnectedServer } from '@/api/jellyfin/types';
import type { Api } from '@jellyfin/sdk';

import { authenticateUser, connectToServer, pingServer } from '@/api/jellyfin/jellyfin';
import { authStorage } from '@/api/storage/auth';
import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
import { makeSession } from '@/test/fixtures/jellyfin';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { resetFakeStores } from '@/test/mocks/tauri-store';
import { renderAt } from '@/test/router';
import { signOut } from '@/test/session';
import LoginView from '@/views/LoginView.vue';
import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'));
vi.mock('@/api/jellyfin/jellyfin');

const NAMES: Record<string, string> = { 'http://home:8096': 'Home', 'http://work:8096': 'Work' };

const home = makeSession({
	serverUrl: 'http://home:8096',
	serverId: 'srv-home',
	accessToken: 'home-token',
});
const work = makeSession({
	serverUrl: 'http://work:8096',
	serverId: 'srv-work',
	accessToken: 'work-token',
});

function server(serverUrl: string, id = `srv-${serverUrl}`): ConnectedServer {
	return {
		serverUrl,
		info: { ServerName: NAMES[serverUrl] ?? 'New Server', Version: '10.10.0', Id: id },
		api: { basePath: serverUrl } as Api,
	};
}

function signedInTo(session: AuthenticatedSession) {
	useServerConnection().use(server(session.serverUrl, session.serverId), session.accessToken);
	useAuthSession().session.value = session;
}

// Saved servers load after mount and are named once their health check answers.
const cardFor = async (name: string) =>
	(await screen.findByText(name)).closest('li') as HTMLElement;

async function addServer(address: string) {
	await userEvent.click(screen.getByRole('button', { name: /Add Server/ }));
	await userEvent.type(await screen.findByPlaceholderText('https://jellyfin.example.com'), address);
	await userEvent.click(screen.getByRole('button', { name: /Connect/ }));
}

beforeEach(() => {
	resetFakeStores();
	mockKeychain();
	signOut();
	useServerConnection().errorMessage.value = '';
	useAuthSession().errorMessage.value = '';
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.mocked(pingServer).mockImplementation(async (_sdk, url) => ({ ServerName: NAMES[url] }));
});

describe('LoginView', () => {
	it('on first launch, adds a server, signs in and opens the app with the session saved', async () => {
		const added = server('http://jellyfin.local:8096', 'srv-new');
		const session = makeSession({ serverUrl: added.serverUrl, serverId: 'srv-new' });
		vi.mocked(connectToServer).mockResolvedValue(added);
		vi.mocked(authenticateUser).mockResolvedValue(session);
		const { router } = await renderAt(LoginView, '/login');

		await addServer('jellyfin.local:8096');
		expect(await screen.findByText('New Server (10.10.0)')).toBeInTheDocument();
		await userEvent.type(screen.getByLabelText('Username'), 'neo');
		await userEvent.click(screen.getByRole('button', { name: 'Login' }));

		await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
		expect(useServerConnection().current.value).toBe(added);
		await expect(authStorage.loadActiveSession()).resolves.toEqual(session);
	});

	describe('after signing in', () => {
		async function signInOnNewServer(path: string) {
			const added = server('http://jellyfin.local:8096', 'srv-new');
			vi.mocked(connectToServer).mockResolvedValue(added);
			vi.mocked(authenticateUser).mockResolvedValue(
				makeSession({ serverUrl: added.serverUrl, serverId: 'srv-new' }),
			);
			const { router } = await renderAt(LoginView, path);

			await addServer('jellyfin.local:8096');
			await userEvent.type(await screen.findByLabelText('Username'), 'neo');
			await userEvent.click(screen.getByRole('button', { name: 'Login' }));
			return router;
		}

		it('returns to the page the user was sent away from', async () => {
			const router = await signInOnNewServer('/login?redirect=/library/lib-1');

			await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/library/lib-1'));
		});

		it.each(['https://evil.example/phish', '//evil.example/phish', 'library'])(
			'ignores a redirect that is not an in-app path (%s) and opens home',
			async (redirect) => {
				const router = await signInOnNewServer(`/login?redirect=${encodeURIComponent(redirect)}`);

				await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
			},
		);
	});

	it('refuses to add a saved server again, even typed with different case or a trailing slash', async () => {
		await authStorage.saveSession(home);
		await renderAt(LoginView, '/login');

		await addServer('HTTP://Home:8096/');

		expect(await screen.findByText('This server is already in your list.')).toBeInTheDocument();
		expect(connectToServer).not.toHaveBeenCalled();
	});

	it('refuses a saved server reached through another address, recognising it by its id', async () => {
		await authStorage.saveSession(home);
		vi.mocked(connectToServer).mockResolvedValue(server('http://192.168.1.20:8096', 'srv-home'));
		await renderAt(LoginView, '/login');

		await addServer('192.168.1.20:8096');

		expect(await screen.findByText('New Server is already in your list.')).toBeInTheDocument();
		expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
	});

	it('keeps the dialog open with the reason when the server cannot be reached', async () => {
		vi.mocked(connectToServer).mockRejectedValue(
			new Error('No valid Jellyfin server found at the provided URL.'),
		);
		await renderAt(LoginView, '/login');

		await addServer('nowhere.local');

		const dialog = screen.getByRole('dialog', { name: 'Connect to Server' });
		expect(
			await within(dialog).findByText('No valid Jellyfin server found at the provided URL.'),
		).toBeInTheDocument();
	});

	describe('with saved servers', () => {
		beforeEach(async () => {
			await authStorage.saveSession(work);
			await authStorage.saveSession(home);
			signedInTo(home);
		});

		it('switches to another saved server with its own token and opens the app', async () => {
			vi.mocked(connectToServer).mockResolvedValue(server(work.serverUrl, work.serverId));
			const { router } = await renderAt(LoginView, '/login');

			await userEvent.click(within(await cardFor('Work')).getByRole('button', { name: 'Connect' }));

			await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
			expect(useAuthSession().session.value).toEqual(work);
			expect(useServerConnection().api.value?.accessToken).toBe('work-token');
		});

		it('stays on the current server when the other one turns out to be unreachable', async () => {
			vi.mocked(connectToServer).mockRejectedValue(new Error('timeout'));
			const { router } = await renderAt(LoginView, '/login');

			await userEvent.click(within(await cardFor('Work')).getByRole('button', { name: 'Connect' }));

			expect(router.currentRoute.value.name).toBe('login');
			expect(useAuthSession().session.value).toEqual(home);
			expect(useServerConnection().current.value?.serverUrl).toBe(home.serverUrl);
		});

		it('signs out of the live server when it is forgotten', async () => {
			await renderAt(LoginView, '/login');

			await userEvent.click(
				within(await cardFor('Home')).getByRole('button', { name: 'Forget server' }),
			);

			await vi.waitFor(() => expect(useAuthSession().session.value).toBeNull());
			expect(useServerConnection().api.value).toBeUndefined();
			expect(screen.queryByText('Home')).not.toBeInTheDocument();
		});

		it('keeps the live session when another server is forgotten', async () => {
			await renderAt(LoginView, '/login');

			await userEvent.click(
				within(await cardFor('Work')).getByRole('button', { name: 'Forget server' }),
			);

			await vi.waitFor(() => expect(screen.queryByText('Work')).not.toBeInTheDocument());
			expect(useAuthSession().session.value).toEqual(home);
		});

		it('offers a way back into the app while still signed in', async () => {
			const { router } = await renderAt(LoginView, '/login');

			await userEvent.click(screen.getByRole('button', { name: 'Back' }));

			await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
		});

		it('after signing out, asks for credentials on that same server, with a way to pick another', async () => {
			const { router } = await renderAt(LoginView, '/login?mode=signout');

			expect(await screen.findByText('Home (10.10.0)')).toBeInTheDocument();
			expect(useServerConnection().api.value).toBeUndefined();
			expect(router.currentRoute.value.name).toBe('login');

			await userEvent.click(screen.getByRole('button', { name: 'Change Server' }));
			expect(await screen.findByRole('button', { name: /Add Server/ })).toBeInTheDocument();
		});
	});

	it('offers no way back when nobody is signed in', async () => {
		await renderAt(LoginView, '/login');

		expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
	});
});
