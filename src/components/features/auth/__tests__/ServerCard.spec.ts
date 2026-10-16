import type { ServerHealth } from '@/composables/jellyfin/useServerStatus';

import ServerCard from '@/components/features/auth/ServerCard.vue';
import { makeSession } from '@/test/fixtures/jellyfin';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

const { accessToken: _, ...server } = makeSession({
	serverUrl: 'http://jellyfin.local:8096',
	username: 'neo',
});

function renderCard(props: { health?: ServerHealth; active?: boolean; loading?: boolean } = {}) {
	const onConnect = vi.fn();
	const onForget = vi.fn();
	render(ServerCard, {
		props: { server, active: false, loading: false, onConnect, onForget, ...props },
	});
	return { onConnect, onForget };
}

describe('ServerCard', () => {
	it("shows the server's own name and the saved user once it answers", () => {
		renderCard({ health: { status: 'online', name: 'Home Theater', version: '10.10.0' } });

		expect(screen.getByText('Home Theater')).toBeInTheDocument();
		expect(screen.getByText('Online')).toBeInTheDocument();
		expect(screen.getByText('neo')).toBeInTheDocument();
	});

	it('falls back to the host from the URL while the name is unknown', () => {
		renderCard();

		expect(screen.getByText('jellyfin.local:8096')).toBeInTheDocument();
		expect(screen.getByText('Checking')).toBeInTheDocument();
	});

	it('shows the raw address when it is not a parseable URL', () => {
		const { accessToken: __, ...legacy } = makeSession({ serverUrl: 'jellyfin-box' });
		render(ServerCard, { props: { server: legacy, active: false, loading: false } });

		// Once as the card's name, once as its address line.
		expect(screen.getAllByText('jellyfin-box')).toHaveLength(2);
	});

	it('connects when Connect is clicked', async () => {
		const { onConnect } = renderCard({ health: { status: 'online' } });

		await userEvent.click(screen.getByRole('button', { name: 'Connect' }));

		expect(onConnect).toHaveBeenCalledTimes(1);
	});

	it('cannot connect to a server that is offline', () => {
		renderCard({ health: { status: 'offline', name: 'Home Theater' } });

		expect(screen.getByText('Offline')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled();
	});

	it('marks the active server as connected instead of offering to connect', () => {
		renderCard({ active: true, health: { status: 'online' } });

		expect(screen.getByText('Connected')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
	});

	it('forgets the server, even while it is offline', async () => {
		const { onForget } = renderCard({ health: { status: 'offline' } });

		await userEvent.click(screen.getByRole('button', { name: 'Forget server' }));

		expect(onForget).toHaveBeenCalledTimes(1);
	});

	it('locks both actions while another server action is running', () => {
		renderCard({ loading: true, health: { status: 'online' } });

		expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Forget server' })).toBeDisabled();
	});
});
