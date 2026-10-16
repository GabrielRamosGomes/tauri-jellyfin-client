import { createRouter, createWebHistory } from 'vue-router';

import { restoreSession } from './guards';

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
					component: () => import('@/views/SettingsView.vue'),
				},
				{
					path: 'library/:id',
					name: 'library',
					component: () => import('@/views/LibraryView.vue'),
					props: { title: 'Library' },
				},
				{
					path: 'item/:id',
					name: 'item',
					component: () => import('@/views/ItemDetailView.vue'),
				},
				{
					path: 'person/:id',
					name: 'person',
					component: () => import('@/views/PersonDetailView.vue'),
				},
			],
		},
	],
});

router.beforeEach(restoreSession);

export default router;
