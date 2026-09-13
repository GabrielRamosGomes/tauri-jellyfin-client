import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getLibraryViews } from '@/api/jellyfin/library';

import { useJellyfinResource } from './useJellyfinResource';

// Singleton: libraries are app-wide. No `watch` — the app shell triggers the
// initial `refresh` once a session exists.
const {
	data: libraries,
	loading,
	errorMessage,
	refresh,
} = useJellyfinResource({
	fetcher: ({ api, userId }) => getLibraryViews(api, userId),
	initial: [] as BaseItemDto[],
	errorLabel: 'Failed to load libraries.',
});

export function useLibraries() {
	return { libraries, loading, errorMessage, refresh };
}
