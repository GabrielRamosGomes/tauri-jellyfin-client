import type { Api } from '@jellyfin/sdk';
import type {
	BaseItemDto,
	BaseItemPerson,
	UserDto,
} from '@jellyfin/sdk/lib/generated-client/models';

import {
	ImageType,
	ItemFields,
	ItemFilter,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';

const HOME_ROW_LIMIT = 15;

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

export function getLandscapeImageUrl(api: Api, item: BaseItemDto) {
	const imageApi = getImageApi(api);

	if (item.Type === 'Episode') return imageApi.getItemImageUrl(item, ImageType.Primary);
	if (item.ImageTags?.Thumb) return imageApi.getItemImageUrl(item, ImageType.Thumb);

	return (
		imageApi.getItemBackdropImageUrls(item)[0] ?? imageApi.getItemImageUrl(item, ImageType.Primary)
	);
}

export function getUserAvatarUrl(api: Api, user: UserDto) {
	return getImageApi(api).getUserImageUrl(user);
}

export function getLogoUrl(api: Api, item: BaseItemDto) {
	if (!item.ImageTags?.Logo) return undefined;

	return getImageApi(api).getItemImageUrl(item, ImageType.Logo);
}

export function getPersonImageUrl(api: Api, person: BaseItemPerson) {
	if (!person.Id || !person.PrimaryImageTag) return undefined;

	return getImageApi(api).getItemImageUrlById(person.Id, ImageType.Primary, {
		tag: person.PrimaryImageTag,
	});
}

export async function setFavorite(api: Api, userId: string, itemId: string, isFavorite: boolean) {
	const userLibraryApi = getUserLibraryApi(api);
	const { data } = isFavorite
		? await userLibraryApi.markFavoriteItem({ itemId, userId })
		: await userLibraryApi.unmarkFavoriteItem({ itemId, userId });

	return data;
}

export async function setWatched(api: Api, userId: string, itemId: string, isWatched: boolean) {
	const playstateApi = getPlaystateApi(api);
	const { data } = isWatched
		? await playstateApi.markPlayedItem({ itemId, userId })
		: await playstateApi.markUnplayedItem({ itemId, userId });

	return data;
}

export async function getFavorites(api: Api, userId: string) {
	const itemsApi = getItemsApi(api);
	const { data } = await itemsApi.getItems({
		userId,
		filters: [ItemFilter.IsFavorite],
		recursive: true,
		limit: HOME_ROW_LIMIT,
		sortBy: [ItemSortBy.SortName],
	});

	return data.Items ?? [];
}

export async function getContinueWatching(api: Api, userId: string) {
	const itemsApi = getItemsApi(api);
	const { data } = await itemsApi.getResumeItems({ userId, limit: HOME_ROW_LIMIT });

	return data.Items ?? [];
}

export async function getNextUp(api: Api, userId: string) {
	const tvShowsApi = getTvShowsApi(api);
	const { data } = await tvShowsApi.getNextUp({
		userId,
		limit: HOME_ROW_LIMIT,
		enableResumable: false,
	});

	return data.Items ?? [];
}

export async function getLatestMedia(api: Api, userId: string, parentId: string) {
	const userLibraryApi = getUserLibraryApi(api);
	const { data } = await userLibraryApi.getLatestMedia({
		userId,
		parentId,
		limit: HOME_ROW_LIMIT,
		groupItems: true,
	});

	return data.filter((item) => item.Type !== 'Episode');
}
