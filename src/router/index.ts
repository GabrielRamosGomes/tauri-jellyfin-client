import { useAuthSession } from '@/composables/useAuthSession';
import { useServerConnection } from '@/composables/useServerConnection';
import { createRouter, createWebHistory } from 'vue-router';

declare module 'vue-router' {
	interface RouteMeta {
		requiresAuth?: boolean;
	}
}

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/login',
			name: 'login',
			component: () => import('@/views/LoginView.vue'),
			meta: { requiresAuth: false },
		},
		{
			path: '/',
			component: () => import('@/layouts/AppShell.vue'),
			meta: { requiresAuth: true },
			children: [
				{ path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
				{
					path: 'dashboard',
					name: 'dashboard',
					component: () => import('@/views/ComingSoonView.vue'),
					props: { title: 'Dashboard' },
				},
				{
					path: 'metadata-manager',
					name: 'metadata-manager',
					component: () => import('@/views/ComingSoonView.vue'),
					props: { title: 'Metadata Manager' },
				},
				{
					path: 'settings',
					name: 'settings',
					component: () => import('@/views/ComingSoonView.vue'),
					props: { title: 'Settings' },
				},
			],
		},
	],
});

// Restores the saved session and live connection on first entry into a
// protected route. Runs once per app launch: once `session`/`api` are set
// (both singleton composables), later navigations skip straight through.
router.beforeEach(async (to) => {
	if (to.meta.requiresAuth === false) return;

	const { api, connect } = useServerConnection();
	const { session, restoreActive, logout } = useAuthSession();

	if (api.value && session.value) return;

	const saved = await restoreActive();
	if (!saved) return { name: 'login', query: { redirect: to.fullPath } };

	const server = await connect(saved.serverUrl);
	if (!server) {
		await logout();
		return { name: 'login', query: { redirect: to.fullPath } };
	}

	server.api.accessToken = saved.accessToken;
});

export default router;
