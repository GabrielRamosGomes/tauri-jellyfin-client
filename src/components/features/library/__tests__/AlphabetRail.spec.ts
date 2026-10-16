import AlphabetRail from '@/components/features/library/AlphabetRail.vue';
import { ALL_LETTERS } from '@/composables/jellyfin/useLibraryQuery';
import { withVModel } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

function renderRail(initial = ALL_LETTERS, props: Record<string, unknown> = {}) {
	const { Host, model } = withVModel(AlphabetRail, initial, props);
	render(Host);
	const rail = screen.getByRole('group', { name: 'Filter by letter' });
	const letter = (name: string) => within(rail).getByRole('button', { name });
	return { model, rail, letter };
}

describe('AlphabetRail', () => {
	it('offers All, "#" for numbers and symbols, then A to Z', () => {
		const { rail } = renderRail();

		const letters = within(rail)
			.getAllByRole('button')
			.map((item) => item.textContent?.trim());
		expect(letters).toEqual([ALL_LETTERS, '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']);
	});

	it('marks the current letter as selected', () => {
		const { letter } = renderRail('M');

		expect(letter('M')).toHaveAttribute('aria-pressed', 'true');
		expect(letter(ALL_LETTERS)).toHaveAttribute('aria-pressed', 'false');
	});

	it('filters by the clicked letter', async () => {
		const { model, letter } = renderRail();

		await userEvent.click(letter('B'));

		expect(model.value).toBe('B');
	});

	it('keeps the filter when the selected letter is clicked again, instead of clearing to nothing', async () => {
		const { model, letter } = renderRail('B');

		await userEvent.click(letter('B'));

		expect(model.value).toBe('B');
		expect(letter('B')).toHaveAttribute('aria-pressed', 'true');
	});

	it('can be stepped through with the arrow keys', async () => {
		const { model, letter } = renderRail('A');
		letter('A').focus();

		await userEvent.keyboard('{ArrowDown}{Enter}');

		expect(model.value).toBe('B');
	});

	it('ignores clicks while the library is loading', async () => {
		const { model, letter } = renderRail(ALL_LETTERS, { disabled: true });

		await userEvent.click(letter('C'));

		expect(model.value).toBe(ALL_LETTERS);
	});
});
