import type { BaseItemDto, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';

import { getChildItems, type NameFilter } from '@/api/jellyfin/library';
import { toValue, type MaybeRefOrGetter, type Ref } from 'vue';

import { useJellyfinResource } from './useJellyfinResource';

export function useChildItems(
	parentId: Ref<string>,
	sortBy?: ItemSortBy[],
	nameFilter: MaybeRefOrGetter<NameFilter> = {},
) {
	const {
		data: items,
		loading,
		errorMessage,
		refresh,
	} = useJellyfinResource({
		fetcher: ({ api, userId }) =>
			getChildItems(api, userId, parentId.value, sortBy, toValue(nameFilter)),
		initial: [] as BaseItemDto[],
		errorLabel: 'Failed to load items.',
		watch: [parentId, () => toValue(nameFilter)],
		enabled: () => !!parentId.value,
	});

	return { items, loading, errorMessage, refresh };
}
