import AddServerDialog from '@/components/features/auth/AddServerDialog.vue';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

async function renderDialog(
	props: { loading?: boolean; errorMessage?: string } = {},
	initialUrl = '',
) {
	const open = ref(true);
	const url = ref(initialUrl);
	const onSubmit = vi.fn();
	const Host = defineComponent({
		setup: () => () =>
			h(AddServerDialog, {
				loading: false,
				errorMessage: '',
				...props,
				open: open.value,
				'onUpdate:open': (value: boolean) => (open.value = value),
				url: url.value,
				'onUpdate:url': (value: string) => (url.value = value),
				onSubmit,
			}),
	});
	render(Host);
	// Reka mounts the teleported dialog a tick after render.
	await screen.findByRole('dialog');
	return { open, url, onSubmit };
}

const urlField = () => screen.getByPlaceholderText('https://jellyfin.example.com');
const connectButton = () => screen.getByRole('button', { name: /Connect/ });

describe('AddServerDialog', () => {
	it('opens as a dialog named after its purpose', async () => {
		await renderDialog();

		expect(screen.getByRole('dialog', { name: 'Connect to Server' })).toBeInTheDocument();
	});

	it.each(['', '   '])('cannot connect with an empty address (%j)', async (typed) => {
		const { onSubmit } = await renderDialog({}, typed);

		await userEvent.click(connectButton());

		expect(connectButton()).toBeDisabled();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('connects to the typed address with the button', async () => {
		const { url, onSubmit } = await renderDialog();

		await userEvent.type(urlField(), 'https://jellyfin.example.com');
		await userEvent.click(connectButton());

		expect(url.value).toBe('https://jellyfin.example.com');
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('connects with Enter in the address field', async () => {
		const { onSubmit } = await renderDialog();

		await userEvent.type(urlField(), 'https://jellyfin.example.com{Enter}');

		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	// Server discovery adds the scheme and probes candidates, so these must reach it, not be
	// blocked by the browser's own URL validation.
	it.each(['192.168.1.20:8096', 'jellyfin.local:8096', 'jellyfin.local'])(
		'accepts the address "%s" without a scheme',
		async (address) => {
			const { url, onSubmit } = await renderDialog();

			await userEvent.type(urlField(), address);
			await userEvent.click(connectButton());

			expect(url.value).toBe(address);
			expect(onSubmit).toHaveBeenCalledTimes(1);
		},
	);

	it.each([
		['Cancel', () => userEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
		['Escape', () => userEvent.keyboard('{Escape}')],
	])('closes without connecting on %s', async (_, close) => {
		const { open, onSubmit } = await renderDialog({}, 'https://jellyfin.example.com');

		await close();

		expect(open.value).toBe(false);
		expect(onSubmit).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('shows why the connection failed', async () => {
		await renderDialog({ errorMessage: 'No valid Jellyfin server found at the provided URL.' });

		expect(
			screen.getByText('No valid Jellyfin server found at the provided URL.'),
		).toBeInTheDocument();
	});

	it('locks the form while connecting', async () => {
		await renderDialog({ loading: true }, 'https://jellyfin.example.com');

		expect(urlField()).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
		expect(screen.getByRole('button', { name: /Connecting/ })).toBeDisabled();
	});
});
