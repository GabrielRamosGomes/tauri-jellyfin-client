import UiSelect from '@/components/ui/UiSelect.vue';
import { withVModel } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

const themes = [
	{ value: 'system', label: 'System' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
];

function renderSelect(props: Record<string, unknown> = {}, initial = 'system') {
	const { Host, model } = withVModel(UiSelect, initial, {
		options: themes,
		ariaLabel: 'Appearance',
		...props,
	});
	render(Host);
	return { model, trigger: screen.getByRole('combobox', { name: 'Appearance' }) };
}

describe('UiSelect', () => {
	it('shows the label of the selected option', async () => {
		const { trigger } = renderSelect({}, 'dark');

		// Reka fills the value in once its (hidden) options have registered, a tick after mount.
		await waitFor(() => expect(trigger).toHaveTextContent('Dark'));
	});

	it('lists every option when opened, marking the selected one', async () => {
		const { trigger } = renderSelect({}, 'light');

		await userEvent.click(trigger);

		const options = screen.getAllByRole('option');
		expect(options.map((option) => option.textContent?.trim())).toEqual([
			'System',
			'Light',
			'Dark',
		]);
		expect(screen.getByRole('option', { name: 'Light' })).toHaveAttribute('aria-selected', 'true');
	});

	it('selects an option with the pointer and closes', async () => {
		const { trigger, model } = renderSelect();

		await userEvent.click(trigger);
		await userEvent.click(screen.getByRole('option', { name: 'Dark' }));

		expect(model.value).toBe('dark');
		expect(trigger).toHaveTextContent('Dark');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('can be operated with the keyboard alone', async () => {
		const { trigger, model } = renderSelect();
		trigger.focus();

		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

		expect(model.value).toBe('dark');
	});

	it('closes on Escape without changing the value', async () => {
		const { trigger, model } = renderSelect();

		await userEvent.click(trigger);
		await userEvent.keyboard('{Escape}');

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(model.value).toBe('system');
	});

	it('cannot be opened while disabled', async () => {
		const { trigger } = renderSelect({ disabled: true });

		await userEvent.click(trigger);

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});
});
