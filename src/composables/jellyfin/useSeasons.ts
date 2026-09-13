import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import { computed, type Ref } from 'vue';

import { useChildItems } from './useChildItems';

export function useSeasons(seriesId: Ref<string>) {
	const { items, loading } = useChildItems(seriesId, [ItemSortBy.IndexNumber]);

	const seasons = computed(() => items.value.filter((item) => item.Type === 'Season'));

	return { seasons, loading };
}
