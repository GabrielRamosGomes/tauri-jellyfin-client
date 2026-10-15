import { getLibraryGenres, type LibraryGenre } from '@/api/jellyfin/library';
import { type Ref } from 'vue';

import { useJellyfinResource } from './useJellyfinResource';

export function useLibraryGenres(libraryId: Ref<string>) {
	const { data: genres } = useJellyfinResource({
		fetcher: ({ api, userId }) => getLibraryGenres(api, userId, libraryId.value),
		initial: [] as LibraryGenre[],
		errorLabel: 'Failed to load genres.',
		watch: libraryId,
		enabled: () => !!libraryId.value,
	});

	return { genres };
}
