import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemDetail } from '@/api/jellyfin/library';
import { ref, watch, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export function useItemDetail(itemId: Ref<string>) {
	const item = ref<BaseItemDto | null>(null);
	const loading = ref(false);
	const errorMessage = ref('');

	async function refresh() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();

		if (!api.value || !session.value) return;

		loading.value = true;
		errorMessage.value = '';

		try {
			item.value = await getItemDetail(api.value, session.value.userId, itemId.value);
		} catch (error) {
			errorMessage.value = error instanceof Error ? error.message : 'Failed to load item.';
			console.error('Error fetching item detail:', errorMessage.value);
		} finally {
			loading.value = false;
		}
	}

	watch(itemId, refresh, { immediate: true });

	return { item, loading, errorMessage, refresh };
}
