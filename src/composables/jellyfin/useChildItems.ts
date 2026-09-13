import type { BaseItemDto, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';

import { getChildItems } from '@/api/jellyfin/library';
import { ref, watch, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export function useChildItems(parentId: Ref<string>, sortBy?: ItemSortBy[]) {
	const loading = ref(false);
	const errorMessage = ref('');

	const items = ref<BaseItemDto[]>([]);

	async function refresh() {
		if (!parentId.value) {
			items.value = [];
			return;
		}

		const { api } = useServerConnection();
		const { session } = useAuthSession();

		if (!api.value || !session.value) return;

		loading.value = true;
		errorMessage.value = '';

		try {
			items.value = await getChildItems(api.value, session.value.userId, parentId.value, sortBy);
		} catch (error) {
			errorMessage.value = error instanceof Error ? error.message : 'Failed to load items.';
			console.error('Error fetching child items:', errorMessage.value);
		} finally {
			loading.value = false;
		}
	}

	watch(parentId, refresh, { immediate: true });

	return { items, loading, errorMessage, refresh };
}
