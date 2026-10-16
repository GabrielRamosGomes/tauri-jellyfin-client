import LoginForm from '@/components/features/auth/LoginForm.vue';
import { withVModel } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

const serverInfo = { ServerName: 'Home', Version: '10.10.0' };

function renderLogin(props: Record<string, unknown> = {}) {
	const onSubmit = vi.fn();
	const onUseDifferentServer = vi.fn();
	const { Host, model } = withVModel(
		LoginForm,
		{ username: '', password: '' },
		{ serverInfo, loading: false, errorMessage: '', onSubmit, onUseDifferentServer, ...props },
	);
	render(Host);
	return { model, onSubmit, onUseDifferentServer };
}

describe('LoginForm', () => {
	it('shows which server the user is signing in to', () => {
		renderLogin();

		expect(screen.getByText('Home (10.10.0)')).toBeInTheDocument();
	});

	it('fills the credentials as the user types', async () => {
		const { model } = renderLogin();

		await userEvent.type(screen.getByLabelText('Username'), 'neo');
		await userEvent.type(screen.getByLabelText('Password'), 'red-pill');

		expect(model.value).toEqual({ username: 'neo', password: 'red-pill' });
	});

	it('submits with the Login button and with Enter in the password field', async () => {
		const { onSubmit } = renderLogin();
		await userEvent.type(screen.getByLabelText('Username'), 'neo');

		await userEvent.click(screen.getByRole('button', { name: 'Login' }));
		await userEvent.type(screen.getByLabelText('Password'), 'red-pill{Enter}');

		expect(onSubmit).toHaveBeenCalledTimes(2);
	});

	it('does not submit without a username', async () => {
		const { onSubmit } = renderLogin();

		await userEvent.click(screen.getByRole('button', { name: 'Login' }));

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('allows signing in with an empty password, which Jellyfin users may have', async () => {
		const { onSubmit } = renderLogin();

		await userEvent.type(screen.getByLabelText('Username'), 'guest{Enter}');

		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('goes back to server selection without submitting', async () => {
		const { onSubmit, onUseDifferentServer } = renderLogin();

		await userEvent.click(screen.getByRole('button', { name: 'Change Server' }));

		expect(onUseDifferentServer).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('shows the login error', () => {
		renderLogin({ errorMessage: 'Invalid username or password' });

		expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
	});

	it('locks the form while signing in', () => {
		renderLogin({ loading: true });

		expect(screen.getByLabelText('Username')).toBeDisabled();
		expect(screen.getByLabelText('Password')).toBeDisabled();
		expect(screen.getByRole('button', { name: /Signing in/ })).toBeDisabled();
	});
});
