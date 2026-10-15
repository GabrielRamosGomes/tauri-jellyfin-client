import type { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models';

import { setFavorite, setWatched } from '@/api/jellyfin/library';
import { useItemActions } from '@/composables/jellyfin/useItemActions';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred, withScope } from '@/test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/library');

const SYNC_DELAY_MS = 400;

beforeEach(() => {
	vi.useFakeTimers();
	signOut();
	signIn();
});

describe.each([
	{ action: 'toggleFavorite', request: setFavorite, field: 'IsFavorite' },
	{ action: 'toggleWatched', request: setWatched, field: 'Played' },
] as const)('$action', ({ action, request, field }) => {
	function setup(initial = false) {
		const item = ref(makeItem({ Id: 'item-1', UserData: { [field]: initial } }));
		const [actions, scope] = withScope(() => useItemActions(item));
		const state = () => item.value.UserData?.[field];
		return { item, actions, scope, state, toggle: actions[action] };
	}

	it('flips the state instantly, before the server is asked', () => {
		const { toggle, state } = setup(false);

		toggle();

		expect(state()).toBe(true);
		expect(request).not.toHaveBeenCalled();
	});

	it('sends only the settled state after rapid clicks', async () => {
		vi.mocked(request).mockResolvedValue({ [field]: true });
		const { toggle } = setup(false);

		toggle();
		toggle();
		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);

		expect(request).toHaveBeenCalledExactlyOnceWith(expect.anything(), 'user-1', 'item-1', true);
	});

	it("adopts the server's user data once synced", async () => {
		const serverData: UserItemDataDto = { [field]: true, PlayCount: 3 };
		vi.mocked(request).mockResolvedValue(serverData);
		const { toggle, item } = setup(false);

		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);

		expect(item.value.UserData).toEqual(serverData);
	});

	it('reverts the flip when the server rejects the change', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.mocked(request).mockRejectedValue(new Error('Server returned 500'));
		const { toggle, state, actions } = setup(false);

		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);

		expect(state()).toBe(false);
		expect(actions.pending.value).toBe(false);
	});

	it('ignores a slow response that a newer change has already superseded', async () => {
		const first = deferred<UserItemDataDto>();
		const second = deferred<UserItemDataDto>();
		vi.mocked(request).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const { toggle, state, actions } = setup(false);

		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);
		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);

		first.resolve({ [field]: true });
		await vi.advanceTimersByTimeAsync(0);
		expect(state()).toBe(false);
		expect(actions.pending.value).toBe(true);

		second.resolve({ [field]: false });
		await vi.advanceTimersByTimeAsync(0);
		expect(state()).toBe(false);
		expect(actions.pending.value).toBe(false);
	});

	it('still saves the change when the page is left before the sync delay', () => {
		vi.mocked(request).mockResolvedValue({ [field]: true });
		const { toggle, scope } = setup(false);

		toggle();
		scope.stop();

		expect(request).toHaveBeenCalledExactlyOnceWith(expect.anything(), 'user-1', 'item-1', true);
	});

	it('is pending while the change is being saved', async () => {
		const response = deferred<UserItemDataDto>();
		vi.mocked(request).mockReturnValue(response.promise);
		const { toggle, actions } = setup(false);

		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);
		expect(actions.pending.value).toBe(true);

		response.resolve({ [field]: true });
		await vi.advanceTimersByTimeAsync(0);
		expect(actions.pending.value).toBe(false);
	});

	it('only flips locally while signed out', async () => {
		signOut();
		const { toggle, state } = setup(false);

		toggle();
		await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);

		expect(state()).toBe(true);
		expect(request).not.toHaveBeenCalled();
	});
});

it('keeps favorite and watched syncs independent of each other', async () => {
	vi.mocked(setFavorite).mockResolvedValue({ IsFavorite: true, Played: false });
	vi.mocked(setWatched).mockResolvedValue({ IsFavorite: true, Played: true });
	const item = ref(makeItem({ UserData: { IsFavorite: false, Played: false } }));
	const [{ toggleFavorite, toggleWatched }] = withScope(() => useItemActions(item));

	toggleFavorite();
	toggleWatched();
	await vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);

	expect(setFavorite).toHaveBeenCalledTimes(1);
	expect(setWatched).toHaveBeenCalledTimes(1);
	expect(item.value.UserData).toMatchObject({ IsFavorite: true, Played: true });
});
