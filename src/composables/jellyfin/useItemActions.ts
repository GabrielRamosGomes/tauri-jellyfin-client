import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { setFavorite, setWatched } from '@/api/jellyfin/library';
import { ref, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

export function useItemActions(item: Ref<BaseItemDto>) {
	const pending = ref(false);

	async function toggleFavorite() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value || !item.value?.Id || pending.value) return;

		// Optimistic: flip the state now, roll back only if the request fails.
		const previous = item.value.UserData;
		const nextValue = !previous?.IsFavorite;
		item.value.UserData = { ...previous, IsFavorite: nextValue };

		pending.value = true;
		try {
			item.value.UserData = await setFavorite(
				api.value,
				session.value.userId,
				item.value.Id,
				nextValue,
			);
		} catch (error) {
			item.value.UserData = previous;
			console.error('Failed to update favorite:', error);
		} finally {
			pending.value = false;
		}
	}

	async function toggleWatched() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value || !item.value?.Id || pending.value) return;

		// Optimistic: flip the state now, roll back only if the request fails.
		const previous = item.value.UserData;
		const nextValue = !previous?.Played;
		item.value.UserData = { ...previous, Played: nextValue };

		pending.value = true;
		try {
			item.value.UserData = await setWatched(
				api.value,
				session.value.userId,
				item.value.Id,
				nextValue,
			);
		} catch (error) {
			item.value.UserData = previous;
			console.error('Failed to update watched:', error);
		} finally {
			pending.value = false;
		}
	}

	return { pending, toggleFavorite, toggleWatched };
}
