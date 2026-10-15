import { useJellyfinResource } from '@/composables/jellyfin/useJellyfinResource';
import { makeSession } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred, withScope } from '@/test/utils';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

beforeEach(() => {
	signOut();
});

describe('useJellyfinResource', () => {
	it('does not fetch while signed out', async () => {
		const fetcher = vi.fn();

		const [{ data, refresh }] = withScope(() => useJellyfinResource({ fetcher, initial: [] }));
		await refresh();

		expect(fetcher).not.toHaveBeenCalled();
		expect(data.value).toEqual([]);
	});

	it("fetches with the live api and the signed-in user's id", async () => {
		const { api } = signIn(makeSession({ userId: 'user-42' }));
		const fetcher = vi.fn().mockResolvedValue(['a', 'b']);

		const [{ data, refresh }] = withScope(() => useJellyfinResource({ fetcher, initial: [] }));
		await refresh();

		expect(fetcher).toHaveBeenCalledWith({ api, userId: 'user-42' });
		expect(data.value).toEqual(['a', 'b']);
	});

	it('loads immediately and again whenever the watched source changes', async () => {
		signIn();
		const id = ref('item-1');
		const fetcher = vi.fn(async () => `detail of ${id.value}`);

		const [{ data }] = withScope(() => useJellyfinResource({ fetcher, initial: '', watch: id }));
		await flushPromises();
		expect(data.value).toBe('detail of item-1');

		id.value = 'item-2';
		await flushPromises();
		expect(data.value).toBe('detail of item-2');
	});

	it('resets to the initial value without fetching when disabled', async () => {
		signIn();
		const id = ref('person-1');
		const fetcher = vi.fn().mockResolvedValue(['film']);
		const [{ data }] = withScope(() =>
			useJellyfinResource({
				fetcher,
				initial: [] as string[],
				watch: id,
				enabled: () => !!id.value,
			}),
		);
		await flushPromises();

		id.value = '';
		await flushPromises();

		expect(data.value).toEqual([]);
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it('is loading only while the request is in flight', async () => {
		signIn();
		const response = deferred<string>();
		const [{ loading, refresh }] = withScope(() =>
			useJellyfinResource({ fetcher: () => response.promise, initial: '' }),
		);

		const pending = refresh();
		expect(loading.value).toBe(true);

		response.resolve('done');
		await pending;
		expect(loading.value).toBe(false);
	});

	describe('on failure', () => {
		beforeEach(() => {
			signIn();
			vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		it('exposes the error message and keeps the previous data', async () => {
			const fetcher = vi
				.fn()
				.mockResolvedValueOnce(['cached'])
				.mockRejectedValueOnce(new Error('Server returned 500'));
			const [{ data, errorMessage, loading, refresh }] = withScope(() =>
				useJellyfinResource({ fetcher, initial: [] as string[] }),
			);
			await refresh();

			await refresh();

			expect(errorMessage.value).toBe('Server returned 500');
			expect(data.value).toEqual(['cached']);
			expect(loading.value).toBe(false);
		});

		it.each([
			['the resource label', 'Failed to load genres.', 'Failed to load genres.'],
			['a generic message', undefined, 'Something went wrong.'],
		])('falls back to %s for non-Error failures', async (_, errorLabel, expected) => {
			const [{ errorMessage, refresh }] = withScope(() =>
				useJellyfinResource({ fetcher: () => Promise.reject('offline'), initial: [], errorLabel }),
			);

			await refresh();

			expect(errorMessage.value).toBe(expected);
		});

		it('clears the error when a retry succeeds', async () => {
			const fetcher = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce([]);
			const [{ errorMessage, refresh }] = withScope(() =>
				useJellyfinResource({ fetcher, initial: [] }),
			);
			await refresh();

			await refresh();

			expect(errorMessage.value).toBe('');
		});
	});
});
