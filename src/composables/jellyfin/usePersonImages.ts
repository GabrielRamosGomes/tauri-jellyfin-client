import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

import { getItemDetail, getLibraryImageUrl, getPersonImageUrl } from '@/api/jellyfin/library';
import { ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

type Recovery = { status: 'recovering' | 'failed' } | { status: 'recovered'; url: string };

export function usePersonImages() {
	const recoveries = ref<Record<string, Recovery>>({});

	function imageUrl(person: BaseItemPerson) {
		const { api } = useServerConnection();
		if (!api.value) return undefined;

		const recovery = person.Id ? recoveries.value[person.Id] : undefined;
		if (!recovery) return getPersonImageUrl(api.value, person);
		return recovery.status === 'recovered' ? recovery.url : undefined;
	}

	async function onImageError(person: BaseItemPerson) {
		const id = person.Id;
		if (!id) return;
		if (recoveries.value[id]) {
			recoveries.value[id] = { status: 'failed' };
			return;
		}

		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value) return;

		const brokenUrl = getPersonImageUrl(api.value, person);
		recoveries.value[id] = { status: 'recovering' };
		try {
			const refreshed = await getItemDetail(api.value, session.value.userId, id);
			const url = refreshed.ImageTags?.Primary
				? getLibraryImageUrl(api.value, refreshed)
				: undefined;
			// Same URL means the server did not replace the image, so it would fail again.
			recoveries.value[id] =
				url && url !== brokenUrl ? { status: 'recovered', url } : { status: 'failed' };
		} catch {
			recoveries.value[id] = { status: 'failed' };
		}
	}

	return { imageUrl, onImageError };
}
