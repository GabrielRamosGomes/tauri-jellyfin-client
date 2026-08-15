import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models';

import { getCurrentUser } from '@/api/jellyfin/jellyfin';
import { getUserAvatarUrl } from '@/api/jellyfin/library';
import { computed, ref } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

const profile = ref<UserDto | null>(null);

export function useUserProfile() {
	const { api } = useServerConnection();
	const { session } = useAuthSession();

	async function refresh() {
		if (!api.value || !session.value) return;

		profile.value = await getCurrentUser(api.value);
	}

	const avatarUrl = computed(() =>
		api.value && profile.value ? getUserAvatarUrl(api.value, profile.value) : undefined,
	);

	return { profile, avatarUrl, refresh };
}
