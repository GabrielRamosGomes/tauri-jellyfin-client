import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getLibraryViews } from '@/api/jellyfin/library';
import { ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

const loading = ref(false);
const errorMessage = ref('');

const libraries = ref<BaseItemDto[]>([]);

async function refresh() {
	const { api } = useServerConnection();
	const { session } = useAuthSession();

	if (!api.value || !session.value) return;

	loading.value = true;
	errorMessage.value = '';

	try {
		libraries.value = await getLibraryViews(api.value, session.value.userId);
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Failed to load libraries.';
		console.error('Error fetching library views:', errorMessage.value);
	} finally {
		loading.value = false;
	}
}

export function useLibraries() {
	return { libraries, loading, errorMessage, refresh };
}
