import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemDetail } from '@/api/jellyfin/library';
import { type Ref } from 'vue';

import { useJellyfinResource } from './useJellyfinResource';

export function useItemDetail(itemId: Ref<string>) {
	const {
		data: item,
		loading,
		errorMessage,
		refresh,
	} = useJellyfinResource<BaseItemDto | null>({
		fetcher: ({ api, userId }) => getItemDetail(api, userId, itemId.value),
		initial: null,
		errorLabel: 'Failed to load item.',
		watch: itemId,
	});

	return { item, loading, errorMessage, refresh };
}
