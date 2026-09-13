import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemsByPerson } from '@/api/jellyfin/library';
import { computed, ref, watch, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

// Jellyfin item types → the tab labels the design shows. Order here is the tab
// order; only groups that actually have items get rendered.
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
	const loading = ref(false);
	const errorMessage = ref('');
	const items = ref<BaseItemDto[]>([]);

	// Only the buckets that came back with something — this is the "show only
	// categories it has data for" part of the request.
	const groups = computed<FilmographyGroup[]>(() =>
		GROUPS.map(({ key, label, types }) => ({
			key,
			label,
			items: items.value.filter((item) => item.Type && types.includes(item.Type)),
		})).filter((group) => group.items.length > 0),
	);

	async function refresh() {
		if (!personId.value) {
			items.value = [];
			return;
		}

		const { api } = useServerConnection();
		const { session } = useAuthSession();

		if (!api.value || !session.value) return;

		loading.value = true;
		errorMessage.value = '';

		try {
			items.value = await getItemsByPerson(api.value, session.value.userId, personId.value);
		} catch (error) {
			errorMessage.value = error instanceof Error ? error.message : 'Failed to load filmography.';
			console.error('Error fetching filmography:', errorMessage.value);
		} finally {
			loading.value = false;
		}
	}

	watch(personId, refresh, { immediate: true });

	return { groups, loading, errorMessage, refresh };
}
