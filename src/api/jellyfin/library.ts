import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { ImageType, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';

export async function getLibraryViews(api: Api, userId: string) {
	const userViewsApi = getUserViewsApi(api);
	const { data } = await userViewsApi.getUserViews({
		userId,
	});

	return data.Items ?? [];
}

export function getLibraryImageUrl(api: Api, library: BaseItemDto) {
	const url = getImageApi(api).getItemImageUrl(library, ImageType.Primary);
	if (!url) return undefined;

	return url;
}

export async function getItemsInLibrary(api: Api, userId: string, parentId: string) {
	const itemsApi = getItemsApi(api);
	const { data } = await itemsApi.getItems({
		userId,
		parentId,
		recursive: false,
		sortBy: [ItemSortBy.SortName],
		sortOrder: [SortOrder.Ascending],
	});

	return data.Items ?? [];
}
