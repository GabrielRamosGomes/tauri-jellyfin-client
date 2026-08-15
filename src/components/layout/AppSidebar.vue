<template>
	<div
		class="nav-drawer-backdrop"
		:class="{ 'nav-drawer-backdrop--visible': isOpen }"
		@click="close"
	/>

	<aside class="nav-drawer" :class="{ 'nav-drawer--open': isOpen }">
		<button type="button" class="nav-drawer-close" @click="close">
			<panel-left-close :size="20" />
			<span>Close</span>
		</button>

		<nav class="sidebar-nav">
			<nav-group :items="homeItems" />

			<hr class="nav-divider" />

			<nav-group :items="libraryItems" empty-text="No libraries yet" />

			<hr class="nav-divider" />

			<nav-group label="Administration" :items="adminItems" />
		</nav>

		<footer class="nav-drawer-footer">
			<span>tauri-jellyfin-client v{{ appVersion }}</span>
		</footer>
	</aside>
</template>

<script setup lang="ts">
	import type { NavItem } from './NavGroup.vue';
	import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models';

	import { useLibraries } from '@/composables/useLibraries';
	import { useNavDrawer } from '@/composables/useNavDrawer';
	import {
		BookOpen,
		FilePenLine,
		Film,
		Folder,
		Home,
		LayoutDashboard,
		Music,
		PanelLeftClose,
		Tv,
	} from 'lucide-vue-next';
	import { computed, watch } from 'vue';
	import { useRoute } from 'vue-router';

	import { version as appVersion } from '../../../package.json';
	import NavGroup from './NavGroup.vue';

	const { libraries } = useLibraries();
	const route = useRoute();

	const { isOpen, close } = useNavDrawer();

	watch(
		() => route.fullPath,
		() => close(),
	);

	const LIBRARY_ICONS: Partial<Record<CollectionType, unknown>> = {
		movies: Film,
		tvshows: Tv,
		music: Music,
		books: BookOpen,
	};

	function libraryIcon(collectionType?: CollectionType) {
		return (collectionType && LIBRARY_ICONS[collectionType]) || Folder;
	}

	const homeItems = computed<NavItem[]>(() => [
		{ to: { name: 'home' }, label: 'Home', icon: Home, exact: true },
	]);

	const libraryItems = computed<NavItem[]>(() =>
		libraries.value.map((library) => ({
			to: { name: 'library', params: { id: library.Id } },
			label: library.Name ?? '',
			icon: libraryIcon(library.CollectionType) as NavItem['icon'],
		})),
	);

	const adminItems: NavItem[] = [
		{ to: { name: 'dashboard' }, label: 'Dashboard', icon: LayoutDashboard },
		{ to: { name: 'metadata-manager' }, label: 'Metadata Manager', icon: FilePenLine },
	];
</script>
