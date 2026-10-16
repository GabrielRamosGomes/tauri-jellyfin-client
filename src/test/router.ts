import type { Component } from 'vue';

import { render, type RenderOptions } from '@testing-library/vue';
import { createMemoryHistory, createRouter } from 'vue-router';

const Page = { render: () => null };

// Same names, paths and auth meta as src/router/index.ts, with blank pages: views under test are
// rendered directly, so only navigation targets need to exist.
export function createTestRouter() {
	return createRouter({
		history: createMemoryHistory(),
		routes: [
			{ path: '/login', name: 'login', component: Page, meta: { requiresAuth: false } },
			{ path: '/', name: 'home', component: Page },
			{ path: '/settings', name: 'settings', component: Page },
			{ path: '/dashboard', name: 'dashboard', component: Page },
			{ path: '/metadata-manager', name: 'metadata-manager', component: Page },
			{ path: '/library/:id', name: 'library', component: Page },
			{ path: '/item/:id', name: 'item', component: Page },
			{ path: '/person/:id', name: 'person', component: Page },
		],
	});
}

// Renders `component` as if the app were at `path`, so useRoute()/useRouter() work.
// Assert navigation through the returned router's currentRoute.
export async function renderAt(
	component: Component,
	path: string,
	options: RenderOptions<Component> = {},
) {
	const router = createTestRouter();
	await router.push(path);
	await router.isReady();
	const result = render(component, {
		...options,
		global: { ...options.global, plugins: [router] },
	});
	return { router, ...result };
}
