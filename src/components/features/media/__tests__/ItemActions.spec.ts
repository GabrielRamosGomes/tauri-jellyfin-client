import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { setFavorite } from '@/api/jellyfin/library';
import ItemActions from '@/components/features/media/ItemActions.vue';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

vi.mock('@/api/jellyfin/library');

// The item comes from a reactive source in the app (a view's ref), which is what lets the
// optimistic flip re-render; a plain object prop would not.
function renderActions(userData: BaseItemDto['UserData'] = { IsFavorite: false, Played: false }) {
	const item = ref(makeItem({ Id: 'item-1', UserData: userData }));
	const onCardClick = vi.fn((event: Event) => event.preventDefault());
	const Host = defineComponent({
		setup: () => () =>
			h('a', { href: '/item/item-1', onClick: onCardClick }, [
				h(ItemActions, { item: item.value }),
			]),
	});
	render(Host);
	return { item, onCardClick };
}

beforeEach(() => {
	// Date stays real: with a frozen clock Vue drops events bubbling to parent listeners,
	// which would make the "does not open the card" tests pass no matter what.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	signOut();
	signIn();
	vi.mocked(setFavorite).mockResolvedValue({ IsFavorite: true, Played: false });
});

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('ItemActions', () => {
	it.each([
		[{ IsFavorite: false, Played: false }, 'Add to favorites', 'Mark as watched'],
		[{ IsFavorite: true, Played: true }, 'Remove from favorites', 'Mark as unwatched'],
	])('names each button after what clicking it will do (%o)', (userData, favorite, watched) => {
		renderActions(userData);

		expect(screen.getByRole('button', { name: favorite })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: watched })).toBeInTheDocument();
	});

	it('flips the button the moment it is clicked', async () => {
		renderActions();

		await user().click(screen.getByRole('button', { name: 'Add to favorites' }));

		expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
		expect(setFavorite).not.toHaveBeenCalled();
	});

	it('saves the change to the server once the clicks settle', async () => {
		renderActions();

		await user().click(screen.getByRole('button', { name: 'Add to favorites' }));
		await vi.advanceTimersByTimeAsync(400);

		expect(setFavorite).toHaveBeenCalledExactlyOnceWith(
			expect.anything(),
			'user-1',
			'item-1',
			true,
		);
	});

	it.each(['Add to favorites', 'Mark as watched'])(
		'does not open the card it sits on when "%s" is clicked',
		async (name) => {
			const { onCardClick } = renderActions();

			await user().click(screen.getByRole('button', { name }));

			expect(onCardClick).not.toHaveBeenCalled();
		},
	);
});
