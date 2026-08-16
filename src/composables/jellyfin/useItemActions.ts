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

		pending.value = true;
		try {
			const nextValue = !item.value.UserData?.IsFavorite;
			item.value.UserData = await setFavorite(
				api.value,
				session.value.userId,
				item.value.Id,
				nextValue,
			);
		} finally {
			pending.value = false;
		}
	}

	async function toggleWatched() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value || !item.value?.Id || pending.value) return;

		pending.value = true;
		try {
			const nextValue = !item.value.UserData?.Played;
			item.value.UserData = await setWatched(
				api.value,
				session.value.userId,
				item.value.Id,
				nextValue,
			);
		} finally {
			pending.value = false;
		}
	}

	return { pending, toggleFavorite, toggleWatched };
}
