import { getNextUp } from '@/api/jellyfin/library';
import { useNextUp } from '@/composables/jellyfin/useNextUp';
import { makeItem } from '@/test/fixtures/jellyfin';
import { signIn, signOut } from '@/test/session';
import { deferred, withScope } from '@/test/utils';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/api/jellyfin/library');

beforeEach(() => {
	signOut();
	signIn();
});

describe('useNextUp', () => {
	it("shows the series' next episode to watch", async () => {
		const next = makeItem({ Id: 's1e4', Type: 'Episode' });
		vi.mocked(getNextUp).mockResolvedValue([next]);

		const [{ nextUpItem }] = withScope(() => useNextUp(ref('series-1')));
		await flushPromises();

		expect(getNextUp).toHaveBeenCalledWith(expect.anything(), 'user-1', 'series-1');
		expect(nextUpItem.value).toEqual(next);
	});

	it('shows nothing once the series is finished', async () => {
		vi.mocked(getNextUp).mockResolvedValue([]);

		const [{ nextUpItem }] = withScope(() => useNextUp(ref('series-1')));
		await flushPromises();

		expect(nextUpItem.value).toBeUndefined();
	});

	it('clears the previous series episode when there is no series to look up', async () => {
		vi.mocked(getNextUp).mockResolvedValue([makeItem({ Id: 's1e4' })]);
		const seriesId = ref('series-1');
		const [{ nextUpItem }] = withScope(() => useNextUp(seriesId));
		await flushPromises();

		seriesId.value = '';
		await flushPromises();

		expect(nextUpItem.value).toBeUndefined();
		expect(getNextUp).toHaveBeenCalledTimes(1);
	});

	it("keeps the newer series' episode when the previous lookup answers last", async () => {
		const previousSeries = deferred<ReturnType<typeof makeItem>[]>();
		const newerSeries = deferred<ReturnType<typeof makeItem>[]>();
		vi.mocked(getNextUp)
			.mockReturnValueOnce(previousSeries.promise)
			.mockReturnValueOnce(newerSeries.promise);
		const seriesId = ref('series-1');
		const [{ nextUpItem, loading }] = withScope(() => useNextUp(seriesId));
		seriesId.value = 'series-2';
		await flushPromises();

		newerSeries.resolve([makeItem({ Id: 's2e1' })]);
		await flushPromises();
		previousSeries.resolve([makeItem({ Id: 's1e4' })]);
		await flushPromises();

		expect(nextUpItem.value?.Id).toBe('s2e1');
		expect(loading.value).toBe(false);
	});
});
