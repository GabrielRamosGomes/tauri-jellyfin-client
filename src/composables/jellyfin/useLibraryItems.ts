import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getLibraryItems, type LibraryQuery } from '@/api/jellyfin/library';
import { computed, ref, watch, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

const PAGE_SIZE = 100;

export function useLibraryItems(libraryId: Ref<string>, query: Ref<LibraryQuery>) {
	const items = ref<BaseItemDto[]>([]);
	const total = ref(0);
	const loading = ref(false);
	const errorMessage = ref('');

	const hasMore = computed(() => items.value.length < total.value);

	async function fetchPage(startIndex: number) {
		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value || !libraryId.value) return;

		loading.value = true;
		errorMessage.value = '';
		try {
			const page = await getLibraryItems(api.value, session.value.userId, libraryId.value, {
				startIndex,
				limit: PAGE_SIZE,
				...query.value,
			});
			items.value = startIndex === 0 ? page.items : [...items.value, ...page.items];
			total.value = page.total;
		} catch (error) {
			errorMessage.value = error instanceof Error ? error.message : 'Failed to load library.';
			console.error('Failed to load library.', error);
		} finally {
			loading.value = false;
		}
	}

	function loadMore() {
		if (loading.value || !hasMore.value) return;
		return fetchPage(items.value.length);
	}

	watch([libraryId, query], () => fetchPage(0), { immediate: true });

	return { items, total, loading, errorMessage, hasMore, loadMore };
}
