import type { Api } from '@jellyfin/sdk';

import { ref, watch, type Ref, type WatchSource } from 'vue';

import { useAuthSession } from './useAuthSession';
import { useServerConnection } from './useServerConnection';

interface ResourceContext {
	api: Api;
	userId: string;
}

interface ResourceOptions<T> {
	fetcher: (ctx: ResourceContext) => Promise<T>;
	initial: T;
	errorLabel?: string;
	watch?: WatchSource | WatchSource[];
	enabled?: () => boolean;
}

export function useJellyfinResource<T>(options: ResourceOptions<T>) {
	const data = ref(options.initial) as Ref<T>;
	const loading = ref(false);
	const errorMessage = ref('');

	async function refresh() {
		if (options.enabled && !options.enabled()) {
			data.value = options.initial;
			return;
		}

		const { api } = useServerConnection();
		const { session } = useAuthSession();
		if (!api.value || !session.value) return;

		loading.value = true;
		errorMessage.value = '';
		try {
			data.value = await options.fetcher({ api: api.value, userId: session.value.userId });
		} catch (error) {
			const fallback = options.errorLabel ?? 'Something went wrong.';
			errorMessage.value = error instanceof Error ? error.message : fallback;
			console.error(fallback, error);
		} finally {
			loading.value = false;
		}
	}

	if (options.watch) watch(options.watch, refresh, { immediate: true });

	return { data, loading, errorMessage, refresh };
}
