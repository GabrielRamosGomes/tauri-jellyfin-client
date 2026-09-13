import type { BaseItemDto, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';

import { getChildItems } from '@/api/jellyfin/library';
import { type Ref } from 'vue';

import { useJellyfinResource } from './useJellyfinResource';

export function useChildItems(parentId: Ref<string>, sortBy?: ItemSortBy[]) {
	const {
		data: items,
		loading,
		errorMessage,
		refresh,
	} = useJellyfinResource({
		fetcher: ({ api, userId }) => getChildItems(api, userId, parentId.value, sortBy),
		initial: [] as BaseItemDto[],
		errorLabel: 'Failed to load items.',
		watch: parentId,
		enabled: () => !!parentId.value,
	});

	return { items, loading, errorMessage, refresh };
}
