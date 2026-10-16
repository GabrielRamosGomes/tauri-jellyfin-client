import UiButton from '@/components/ui/UiButton.vue';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

function renderButton(props: Record<string, unknown> = {}) {
	const onClick = vi.fn();
	render(UiButton, { props, attrs: { onClick }, slots: { default: 'Save' } });
	// While loading the spinner's label joins the accessible name ("Loading Save").
	return { onClick, button: screen.getByRole('button', { name: /Save/ }) };
}

describe('UiButton', () => {
	it('responds to clicks', async () => {
		const { onClick, button } = renderButton();

		await userEvent.click(button);

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it.each([
		['disabled', { disabled: true }],
		['loading', { loading: true }],
	])('cannot be clicked while %s', async (_, props) => {
		const { onClick, button } = renderButton(props);

		await userEvent.click(button);

		expect(button).toBeDisabled();
		expect(onClick).not.toHaveBeenCalled();
	});

	it('shows a loading indicator while loading', () => {
		renderButton({ loading: true });

		expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
	});

	it('does not submit the surrounding form unless it is the submit button', async () => {
		const onSubmit = vi.fn((event: Event) => event.preventDefault());
		render({
			render: () =>
				h('form', { onSubmit }, [
					h(UiButton, null, () => 'Change server'),
					h(UiButton, { type: 'submit' }, () => 'Login'),
				]),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Change server' }));
		expect(onSubmit).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole('button', { name: 'Login' }));
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});
});
