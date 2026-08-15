import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto, UserDto } from '@jellyfin/sdk/lib/generated-client/models';

import {
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
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

export async function getChildItems(
	api: Api,
	userId: string,
	parentId: string,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
) {
	const itemsApi = getItemsApi(api);
	const { data } = await itemsApi.getItems({
		userId,
		parentId,
		recursive: false,
		sortBy,
		sortOrder: [SortOrder.Ascending],
		fields: [ItemFields.Overview],
	});

	return data.Items ?? [];
}

export async function getItemDetail(api: Api, userId: string, itemId: string) {
	const useLibraryApi = getUserLibraryApi(api);
	const { data } = await useLibraryApi.getItem({ itemId, userId });

	return data;
}

// Items can have multiple backdrops; hero image just needs the first.
export function getBackdropUrl(api: Api, item: BaseItemDto) {
	const urls = getImageApi(api).getItemBackdropImageUrls(item);
	return urls[0];
}

export function getUserAvatarUrl(api: Api, user: UserDto) {
	return getImageApi(api).getUserImageUrl(user);
}
