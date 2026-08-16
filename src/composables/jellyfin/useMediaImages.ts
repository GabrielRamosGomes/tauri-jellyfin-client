import type { BaseItemDto, BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

import {
	getBackdropUrl,
	getLandscapeImageUrl,
	getLibraryImageUrl,
	getLogoUrl,
	getPersonImageUrl,
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

	function logoUrl(item: BaseItemDto) {
		return api.value ? getLogoUrl(api.value, item) : undefined;
	}

	function personImageUrl(person: BaseItemPerson) {
		return api.value ? getPersonImageUrl(api.value, person) : undefined;
	}

	return { libraryImageUrl, landscapeImageUrl, backdropUrl, logoUrl, personImageUrl };
}
