import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemsByPerson } from '@/api/jellyfin/library';
import { computed, type Ref } from 'vue';

import { useJellyfinResource } from './useJellyfinResource';

const GROUPS: { key: string; label: string; types: string[] }[] = [
	{ key: 'movies', label: 'Movies', types: ['Movie'] },
	{ key: 'shows', label: 'TV Shows', types: ['Series'] },
	{ key: 'books', label: 'Books', types: ['Book'] },
	{ key: 'photos', label: 'Photos', types: ['Photo'] },
	{ key: 'episodes', label: 'Episodes', types: ['Episode'] },
];

export interface FilmographyGroup {
	key: string;
	label: string;
	items: BaseItemDto[];
}

export function usePersonFilmography(personId: Ref<string>) {
	const {
		data: items,
		loading,
		errorMessage,
		refresh,
	} = useJellyfinResource({
		fetcher: ({ api, userId }) => getItemsByPerson(api, userId, personId.value),
		initial: [] as BaseItemDto[],
		errorLabel: 'Failed to load filmography.',
		watch: personId,
		enabled: () => !!personId.value,
	});

	const groups = computed<FilmographyGroup[]>(() =>
		GROUPS.map(({ key, label, types }) => ({
			key,
			label,
			items: items.value.filter((item) => item.Type && types.includes(item.Type)),
		})).filter((group) => group.items.length > 0),
	);

	return { groups, loading, errorMessage, refresh };
}
