import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemsInLibrary } from '@/api/jellyfin/library';
import { ref, watch, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export function useLibraryItems(libraryId: Ref<string>) {
	const loading = ref(false);
	const errorMessage = ref('');

	const items = ref<BaseItemDto[]>([]);

	async function refresh() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();

		if (!api.value || !session.value) return;

		loading.value = true;
		errorMessage.value = '';

		try {
			items.value = await getItemsInLibrary(api.value, session.value.userId, libraryId.value);
		} catch (error) {
			errorMessage.value = error instanceof Error ? error.message : 'Failed to load items.';
			console.error('Error fetching library items:', errorMessage.value);
		} finally {
			loading.value = false;
		}
	}

	watch(libraryId, refresh, { immediate: true });

	return { items, loading, errorMessage, refresh };
}
