import UiDropdown from '@/components/ui/UiDropdown.vue';
import { withVModel } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/vue';
import { Volume2 } from 'lucide-vue-next';
import { describe, expect, it } from 'vitest';

const audioTracks = [
	{ value: '1', label: 'English', description: 'Dolby Digital+ 5.1' },
	{ value: '2', label: 'Japanese', description: 'AAC Stereo' },
];

function renderDropdown(props: Record<string, unknown> = {}, initial = '1') {
	const { Host, model } = withVModel(UiDropdown, initial, {
		options: audioTracks,
		icon: Volume2,
		ariaLabel: 'Audio track',
		...props,
	});
	render(Host);
	return { model, trigger: screen.getByRole('combobox', { name: 'Audio track' }) };
}

describe('UiDropdown', () => {
	it('is named by its aria-label and shows the selected option', async () => {
		const { trigger } = renderDropdown({}, '2');

		await waitFor(() => expect(trigger).toHaveTextContent('Japanese'));
	});

	it('shows the placeholder while nothing is selected', () => {
		const { trigger } = renderDropdown({ placeholder: 'Choose a track' }, '');

		expect(trigger).toHaveTextContent('Choose a track');
	});

	it('describes each option when opened', async () => {
		const { trigger } = renderDropdown();

		await userEvent.click(trigger);

		expect(screen.getByRole('option', { name: /English/ })).toHaveTextContent('Dolby Digital+ 5.1');
		expect(screen.getByRole('option', { name: /Japanese/ })).toHaveTextContent('AAC Stereo');
	});

	it('selects an option and shows only its label, not the description, on the trigger', async () => {
		const { trigger, model } = renderDropdown();

		await userEvent.click(trigger);
		await userEvent.click(screen.getByRole('option', { name: /Japanese/ }));

		expect(model.value).toBe('2');
		expect(trigger).toHaveTextContent('Japanese');
		expect(trigger).not.toHaveTextContent('AAC Stereo');
	});

	it('cannot be opened while disabled, e.g. while the library is loading', async () => {
		const { trigger } = renderDropdown({ disabled: true });

		await userEvent.click(trigger);

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});
});
