import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { setFavorite, setWatched } from '@/api/jellyfin/library';
import { useDebounce } from '@/composables/ui/useDebounce';
import { ref, type Ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

const SYNC_DELAY_MS = 400;

export function useItemActions(item: Ref<BaseItemDto>) {
	const pending = ref(false);

	let favoriteSeq = 0;
	let watchedSeq = 0;

	async function flushFavorite() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value || !item.value?.Id) return;

		const desired = item.value.UserData?.IsFavorite ?? false;
		const seq = ++favoriteSeq;
		pending.value = true;
		try {
			const result = await setFavorite(api.value, session.value.userId, item.value.Id, desired);
			if (seq === favoriteSeq) item.value.UserData = result;
		} catch (error) {
			if (seq === favoriteSeq) {
				item.value.UserData = { ...item.value.UserData, IsFavorite: !desired };
			}
			console.error('Failed to update favorite:', error);
		} finally {
			if (seq === favoriteSeq) pending.value = false;
		}
	}

	async function flushWatched() {
		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value || !item.value?.Id) return;

		const desired = item.value.UserData?.Played ?? false;
		const seq = ++watchedSeq;
		pending.value = true;
		try {
			const result = await setWatched(api.value, session.value.userId, item.value.Id, desired);
			if (seq === watchedSeq) item.value.UserData = result;
		} catch (error) {
			if (seq === watchedSeq) {
				item.value.UserData = { ...item.value.UserData, Played: !desired };
			}
			console.error('Failed to update watched:', error);
		} finally {
			if (seq === watchedSeq) pending.value = false;
		}
	}

	const syncFavorite = useDebounce(flushFavorite, SYNC_DELAY_MS, { flushOnDispose: true });
	const syncWatched = useDebounce(flushWatched, SYNC_DELAY_MS, { flushOnDispose: true });

	// Flip optimistically on every click for instant feedback; the debounced
	// sync sends only the settled state.
	function toggleFavorite() {
		const next = !item.value.UserData?.IsFavorite;
		item.value.UserData = { ...item.value.UserData, IsFavorite: next };
		syncFavorite();
	}

	function toggleWatched() {
		const next = !item.value.UserData?.Played;
		item.value.UserData = { ...item.value.UserData, Played: next };
		syncWatched();
	}

	return { pending, toggleFavorite, toggleWatched };
}
