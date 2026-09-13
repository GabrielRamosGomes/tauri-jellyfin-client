import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import { computed, type Ref } from 'vue';

import { useChildItems } from './useChildItems';

export function useSeasonEpisodes(seasonId: Ref<string>, seasonNumber: Ref<number | undefined>) {
	const { items, loading, errorMessage, refresh } = useChildItems(seasonId, [
		ItemSortBy.IndexNumber,
	]);

	const episodes = computed(() => {
		const seen = new Set<number>();

		return items.value.filter((child) => {
			if (child.Type !== 'Episode') return false;
			if (
				seasonNumber.value != null &&
				child.ParentIndexNumber != null &&
				child.ParentIndexNumber !== seasonNumber.value
			) {
				return false;
			}

			const index = child.IndexNumber;
			if (index === undefined || index === null || seen.has(index)) return false;

			seen.add(index);
			return true;
		});
	});

	return { episodes, loading, errorMessage, refresh };
}
