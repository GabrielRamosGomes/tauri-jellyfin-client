import UiInput from '@/components/ui/UiInput.vue';
import { withVModel } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

function renderInput(props: Record<string, unknown> = {}, initial = '') {
	const { Host, model } = withVModel(UiInput, initial, { label: 'Server URL', ...props });
	render(Host);
	return { model, input: screen.getByLabelText('Server URL') };
}

describe('UiInput', () => {
	it('is reachable through its visible label', () => {
		const { input } = renderInput();

		expect(input).toHaveAttribute('type', 'text');
	});

	it('focuses the field when its label is clicked', async () => {
		const { input } = renderInput();

		await userEvent.click(screen.getByText('Server URL'));

		expect(input).toHaveFocus();
	});

	it('gives every field its own label, even with several on screen', () => {
		render({
			render: () => [
				h(UiInput, { modelValue: '', label: 'Username' }),
				h(UiInput, { modelValue: '', label: 'Password', type: 'password' }),
			],
		});

		expect(screen.getByLabelText('Username')).toHaveAttribute('type', 'text');
		expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
	});

	it('shows the bound value and updates it as the user types', async () => {
		const { input, model } = renderInput({}, 'http://');

		expect(input).toHaveValue('http://');
		await userEvent.type(input, 'jellyfin.local');

		expect(model.value).toBe('http://jellyfin.local');
	});

	it('ignores typing while disabled', async () => {
		const { input, model } = renderInput({ disabled: true });

		await userEvent.type(input, 'abc');

		expect(input).toBeDisabled();
		expect(model.value).toBe('');
	});

	it('announces a validation error as the field description, without changing its label', () => {
		const { input } = renderInput({ error: 'Enter a valid URL' });

		expect(input).toHaveAccessibleName('Server URL');
		expect(input).toHaveAccessibleDescription('Enter a valid URL');
		expect(input).toBeInvalid();
	});

	it('is neither invalid nor described while there is no error', () => {
		const { input } = renderInput();

		expect(input).not.toHaveAttribute('aria-invalid');
		expect(input).not.toHaveAttribute('aria-describedby');
	});

	describe('password', () => {
		it('hides the password until the user reveals it, and can hide it again', async () => {
			const { input } = renderInput({ type: 'password' }, 'red-pill');
			expect(input).toHaveAttribute('type', 'password');

			await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
			expect(input).toHaveAttribute('type', 'text');

			await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
			expect(input).toHaveAttribute('type', 'password');
		});

		it('keeps the typed password when toggling visibility', async () => {
			const { input, model } = renderInput({ type: 'password' });
			await userEvent.type(input, 'red-pill');

			await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

			expect(input).toHaveValue('red-pill');
			expect(model.value).toBe('red-pill');
		});

		it('does not submit the login form when the visibility toggle is clicked', async () => {
			const onSubmit = vi.fn((event: Event) => event.preventDefault());
			render({
				render: () =>
					h('form', { onSubmit }, [
						h(UiInput, { modelValue: '', type: 'password', label: 'Password' }),
					]),
			});

			await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

			expect(onSubmit).not.toHaveBeenCalled();
		});

		it('offers no visibility toggle on other input types', () => {
			renderInput({ type: 'url' });

			expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument();
		});
	});
});
