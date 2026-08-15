import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import {
	getContinueWatching,
	getFavorites,
	getLatestMedia,
	getNextUp,
} from '@/api/jellyfin/library';
import { computed, ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export interface LatestSection {
	libraryId: string;
	libraryName: string;
	items: BaseItemDto[];
}

const loading = ref(false);
const errorMessage = ref('');

const favorites = ref<BaseItemDto[]>([]);
const continueWatching = ref<BaseItemDto[]>([]);
const nextUp = ref<BaseItemDto[]>([]);
const latestByLibrary = ref<LatestSection[]>([]);

let pendingLoads = 0;

function beginLoad() {
	pendingLoads += 1;
	loading.value = true;
}

function endLoad() {
	pendingLoads -= 1;
	if (pendingLoads <= 0) loading.value = false;
}

async function refreshUserSections() {
	const { api } = useServerConnection();
	const { session } = useAuthSession();

	const currentApi = api.value;
	if (!currentApi || !session.value) return;

	const userId = session.value.userId;

	beginLoad();
	try {
		await Promise.all([
			getFavorites(currentApi, userId).then((result) => {
				favorites.value = result;
			}),
			getContinueWatching(currentApi, userId).then((result) => {
				continueWatching.value = result;
			}),
			getNextUp(currentApi, userId).then((result) => {
				nextUp.value = result;
			}),
		]);
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Failed to load home page.';
		console.error('Error fetching home sections:', errorMessage.value);
	} finally {
		endLoad();
	}
}

async function refreshLibrarySections(libraries: BaseItemDto[]) {
	const { api } = useServerConnection();
	const { session } = useAuthSession();

	const currentApi = api.value;
	if (!currentApi || !session.value) return;

	const userId = session.value.userId;
	const libraryIds = libraries
		.map((library) => ({ id: library.Id, name: library.Name ?? '' }))
		.filter((library): library is { id: string; name: string } => Boolean(library.id));

	beginLoad();
	try {
		await Promise.all(
			libraryIds.map((library) =>
				getLatestMedia(currentApi, userId, library.id).then((items) => {
					const section = { libraryId: library.id, libraryName: library.name, items };
					const others = latestByLibrary.value.filter((s) => s.libraryId !== library.id);
					latestByLibrary.value = [...others, section];
				}),
			),
		);
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : 'Failed to load home page.';
		console.error('Error fetching home sections:', errorMessage.value);
	} finally {
		endLoad();
	}
}

const heroItem = computed<BaseItemDto | undefined>(() => {
	if (continueWatching.value.length) return continueWatching.value[0];

	for (const section of latestByLibrary.value) {
		const unwatched = section.items.find((item) => !item.UserData?.Played);
		if (unwatched) return unwatched;
	}

	return undefined;
});

export function useHomeSections() {
	return {
		loading,
		errorMessage,
		favorites,
		continueWatching,
		nextUp,
		latestByLibrary,
		heroItem,
		refreshUserSections,
		refreshLibrarySections,
	};
}
