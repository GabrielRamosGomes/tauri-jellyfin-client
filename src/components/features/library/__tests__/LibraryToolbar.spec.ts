import type { WatchedFilter } from '@/composables/jellyfin/useLibraryQuery';

import LibraryToolbar from '@/components/features/library/LibraryToolbar.vue';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

function renderToolbar(props: { ascending?: boolean; disabled?: boolean } = {}) {
	const watched = ref<WatchedFilter>('all');
	const genreIds = ref<string[]>([]);
	const handlers = { 'onUpdate:sortKey': vi.fn(), onToggleOrder: vi.fn() };
	const Host = defineComponent({
		setup: () => () =>
			h(LibraryToolbar, {
				sortKey: 'name',
				ascending: true,
				genres: [{ Id: 'g-action', Name: 'Action' }],
				...props,
				...handlers,
				watched: watched.value,
				'onUpdate:watched': (value: WatchedFilter) => (watched.value = value),
				genreIds: genreIds.value,
				'onUpdate:genreIds': (value: string[]) => (genreIds.value = value),
			}),
	});
	render(Host);
	return { watched, genreIds, ...handlers };
}

async function choose(dropdown: string, option: string) {
	await userEvent.click(screen.getByRole('combobox', { name: dropdown }));
	await userEvent.click(screen.getByRole('option', { name: option }));
}

describe('LibraryToolbar', () => {
	it('filters by watched status', async () => {
		const { watched } = renderToolbar();

		await choose('Watched status', 'Unwatched');

		expect(watched.value).toBe('unwatched');
	});

	it('asks the library to re-sort by the chosen key', async () => {
		const handlers = renderToolbar();

		await choose('Sort by', 'Release date');

		expect(handlers['onUpdate:sortKey']).toHaveBeenCalledExactlyOnceWith('releaseDate');
	});

	it.each([
		[true, 'Ascending'],
		[false, 'Descending'],
	])('names the order button after the current order (ascending=%s)', async (ascending, label) => {
		const { onToggleOrder } = renderToolbar({ ascending });

		await userEvent.click(screen.getByRole('button', { name: label }));

		expect(onToggleOrder).toHaveBeenCalledTimes(1);
	});

	it('locks every control while the library is loading', () => {
		renderToolbar({ disabled: true });

		expect(screen.getByRole('combobox', { name: 'Watched status' })).toBeDisabled();
		expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Filter by genre' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Ascending' })).toBeDisabled();
	});
});
