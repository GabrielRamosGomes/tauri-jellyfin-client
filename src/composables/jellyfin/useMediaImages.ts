import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import {
	getBackdropUrl,
	getLandscapeImageUrl,
	getLibraryImageUrl,
} from '@/api/jellyfin/library';

import { useServerConnection } from './useServerConnection';

export function useMediaImages() {
	const { api } = useServerConnection();

	function libraryImageUrl(item: BaseItemDto) {
		return api.value ? getLibraryImageUrl(api.value, item) : undefined;
	}

	function landscapeImageUrl(item: BaseItemDto) {
		return api.value ? getLandscapeImageUrl(api.value, item) : undefined;
	}

	function backdropUrl(item: BaseItemDto) {
		return api.value ? getBackdropUrl(api.value, item) : undefined;
	}

	return { libraryImageUrl, landscapeImageUrl, backdropUrl };
}
