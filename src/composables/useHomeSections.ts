import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import {
	getContinueWatching,
	getFavorites,
	getLatestMedia,
	getNextUp,
} from '@/api/jellyfin/library';
import { ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export interface LatestSection {
	libraryId: string;
	libraryName: string;
	items: BaseItemDto[];
}

export function useHomeSections() {
	const loading = ref(false);
	const errorMessage = ref('');

	const favorites = ref<BaseItemDto[]>([]);
	const continueWatching = ref<BaseItemDto[]>([]);
	const nextUp = ref<BaseItemDto[]>([]);
	const latestByLibrary = ref<LatestSection[]>([]);

	async function refresh(libraries: BaseItemDto[]) {
		const { api } = useServerConnection();
		const { session } = useAuthSession();

		const currentApi = api.value;
		if (!currentApi || !session.value) return;

		loading.value = true;
		errorMessage.value = '';

		try {
			const userId = session.value.userId;
			const libraryIds = libraries
				.map((library) => ({ id: library.Id, name: library.Name ?? '' }))
				.filter((library): library is { id: string; name: string } => Boolean(library.id));

			const [favoritesResult, continueWatchingResult, nextUpResult, latestResults] =
				await Promise.all([
					getFavorites(currentApi, userId),
					getContinueWatching(currentApi, userId),
					getNextUp(currentApi, userId),
					Promise.all(
						libraryIds.map(async (library) => ({
							libraryId: library.id,
							libraryName: library.name,
							items: await getLatestMedia(currentApi, userId, library.id),
						})),
					),
				]);

			favorites.value = favoritesResult;
			continueWatching.value = continueWatchingResult;
			nextUp.value = nextUpResult;
			latestByLibrary.value = latestResults;
		} catch (error) {
			errorMessage.value = error instanceof Error ? error.message : 'Failed to load home page.';
			console.error('Error fetching home sections:', errorMessage.value);
		} finally {
			loading.value = false;
		}
	}

	return { loading, errorMessage, favorites, continueWatching, nextUp, latestByLibrary, refresh };
}
