import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getNextUp } from '@/api/jellyfin/library';
import { ref, watch, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export function useNextUp(seriesId: Ref<string>) {
	const loading = ref(false);
	const nextUpItem = ref<BaseItemDto | undefined>();

	async function refresh() {
		if (!seriesId.value) {
			nextUpItem.value = undefined;
			return;
		}

		const { api } = useServerConnection();
		const { session } = useAuthSession();

		if (!api.value || !session.value) return;

		loading.value = true;

		try {
			const items = await getNextUp(api.value, session.value.userId, seriesId.value);
			nextUpItem.value = items[0];
		} catch (error) {
			console.error('Error fetching next up:', error);
		} finally {
			loading.value = false;
		}
	}

	watch(seriesId, refresh, { immediate: true });

	return { nextUpItem, loading, refresh };
}
