import GenreFilter from '@/components/features/library/GenreFilter.vue';
import { withVModel } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

const genres = [
	{ Id: 'g-action', Name: 'Action' },
	{ Id: 'g-drama', Name: 'Drama' },
	{ Id: 'g-scifi', Name: 'Science Fiction' },
];

function renderFilter(initial: string[] = [], props: Record<string, unknown> = {}) {
	const { Host, model } = withVModel(GenreFilter, initial, { genres, ...props });
	render(Host);
	return { model, trigger: screen.getByRole('button', { name: 'Filter by genre' }) };
}

async function open(trigger: HTMLElement) {
	await userEvent.click(trigger);
	return screen.findByRole('dialog');
}

const chip = (name: string) => screen.getByRole('button', { name });

describe('GenreFilter', () => {
	it('lists the library genres when opened', async () => {
		const { trigger } = renderFilter();

		await open(trigger);

		for (const { Name } of genres) expect(chip(Name)).toBeInTheDocument();
	});

	it('toggles several genres on and off', async () => {
		const { trigger, model } = renderFilter();
		await open(trigger);

		await userEvent.click(chip('Action'));
		await userEvent.click(chip('Science Fiction'));
		expect(model.value).toEqual(['g-action', 'g-scifi']);

		await userEvent.click(chip('Action'));
		expect(model.value).toEqual(['g-scifi']);
	});

	it('shows how many genres are selected on the closed trigger', () => {
		const { trigger } = renderFilter(['g-action', 'g-drama']);

		expect(trigger).toHaveTextContent('2');
	});

	it('clears every selected genre at once', async () => {
		const { trigger, model } = renderFilter(['g-action', 'g-drama']);
		await open(trigger);

		await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

		expect(model.value).toEqual([]);
		expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});

	it('offers Clear only when something is selected', async () => {
		const { trigger } = renderFilter([]);

		await open(trigger);

		expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
	});

	it.each([
		['the library has no genres', { genres: [] }],
		['the library is loading', { disabled: true }],
	])('cannot be opened when %s', async (_, props) => {
		const { trigger } = renderFilter([], props);

		await userEvent.click(trigger);

		expect(trigger).toBeDisabled();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
