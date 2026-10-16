import ServerList from '@/components/features/auth/ServerList.vue';
import { makeSession } from '@/test/fixtures/jellyfin';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

function savedServer(serverUrl: string, name: string) {
	const { accessToken: _, ...server } = makeSession({ serverUrl });
	return { server, name, health: { status: 'online' as const, name } };
}

const servers = [
	savedServer('http://home:8096', 'Home'),
	savedServer('http://work:8096', 'Work'),
	savedServer('http://cabin:8096', 'Cabin'),
];
const [home, work, cabin] = servers;

function renderList(activeServerUrl: string | null = null, loading = false) {
	const handlers = { onSwitch: vi.fn(), onForget: vi.fn(), onAdd: vi.fn() };
	render(ServerList, {
		props: {
			servers: servers.map(({ server }) => server),
			health: Object.fromEntries(servers.map(({ server, health }) => [server.serverUrl, health])),
			activeServerUrl,
			loading,
			...handlers,
		},
	});
	return handlers;
}

const listedNames = () =>
	screen
		.getAllByRole('listitem')
		.map((item) => servers.find(({ name }) => within(item).queryByText(name))?.name)
		.filter(Boolean);

const cardFor = (name: string) =>
	screen.getAllByRole('listitem').find((item) => within(item).queryByText(name)) as HTMLElement;

describe('ServerList', () => {
	it('lists the active server first and keeps the saved order for the rest', () => {
		renderList(work.server.serverUrl);

		expect(listedNames()).toEqual(['Work', 'Home', 'Cabin']);
	});

	it('keeps the saved order when no server is active', () => {
		renderList(null);

		expect(listedNames()).toEqual(['Home', 'Work', 'Cabin']);
	});

	it("switches to a server by that server's address", async () => {
		const { onSwitch } = renderList(home.server.serverUrl);

		await userEvent.click(within(cardFor('Cabin')).getByRole('button', { name: 'Connect' }));

		expect(onSwitch).toHaveBeenCalledExactlyOnceWith(cabin.server.serverUrl);
	});

	it("forgets a server by that server's address", async () => {
		const { onForget } = renderList(home.server.serverUrl);

		await userEvent.click(within(cardFor('Work')).getByRole('button', { name: 'Forget server' }));

		expect(onForget).toHaveBeenCalledExactlyOnceWith(work.server.serverUrl);
	});

	it('offers to add another server', async () => {
		const { onAdd } = renderList();

		await userEvent.click(screen.getByRole('button', { name: /Add Server/ }));

		expect(onAdd).toHaveBeenCalledTimes(1);
	});

	it('cannot add a server while another server action is running', () => {
		renderList(null, true);

		expect(screen.getByRole('button', { name: /Add Server/ })).toBeDisabled();
	});
});
