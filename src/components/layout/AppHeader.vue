<template>
	<header class="app-header">
		<div class="app-header-group">
			<ui-icon-button :icon="Menu" label="Menu" @click="toggle" />
			<ui-icon-button :icon="ArrowLeft" label="Back" @click="router.back()" />
			<router-link :to="{ name: 'home' }" class="ui-icon-btn app-header-home">
				<home :size="18" />
			</router-link>
		</div>

		<div class="app-header-group">
			<ui-icon-button :icon="Search" label="Search" />
			<ui-icon-button :icon="Heart" label="Favorites" />

			<dropdown-menu-root v-if="session">
				<dropdown-menu-trigger class="ui-avatar app-header-avatar" title="Account">
					<img v-if="avatarUrl" :src="avatarUrl" alt="" />
					<span v-else>{{ accountInitial }}</span>
				</dropdown-menu-trigger>

				<dropdown-menu-portal>
					<dropdown-menu-content class="dropdown-menu-content" :side-offset="8" align="end">
						<dropdown-menu-item class="dropdown-menu-item" @select="signOut">
							<log-out :size="16" />
							<span>Sign Out</span>
						</dropdown-menu-item>

						<dropdown-menu-separator class="dropdown-menu-separator" />

						<router-link :to="{ name: 'settings' }" custom v-slot="{ navigate }">
							<dropdown-menu-item class="dropdown-menu-item" @select="() => navigate()">
								<settings :size="16" />
								<span>Settings</span>
							</dropdown-menu-item>
						</router-link>
						<router-link :to="{ name: 'login' }" custom v-slot="{ navigate }">
							<dropdown-menu-item class="dropdown-menu-item" @select="() => navigate()">
								<server :size="16" />
								<span>Change Server</span>
							</dropdown-menu-item>
						</router-link>

						<dropdown-menu-separator class="dropdown-menu-separator" />
					</dropdown-menu-content>
				</dropdown-menu-portal>
			</dropdown-menu-root>
		</div>
	</header>
</template>

<script setup lang="ts">
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useAuthSession } from '@/composables/useAuthSession';
	import { useNavDrawer } from '@/composables/useNavDrawer';
	import { useUserProfile } from '@/composables/useUserProfile';
	import { ArrowLeft, Heart, Home, LogOut, Menu, Search, Server, Settings } from 'lucide-vue-next';
	import {
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuPortal,
		DropdownMenuRoot,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from 'reka-ui';
	import { computed } from 'vue';
	import { useRouter } from 'vue-router';

	const router = useRouter();
	const { toggle } = useNavDrawer();
	const { session, logout } = useAuthSession();
	const { avatarUrl } = useUserProfile();

	const accountInitial = computed(() => session.value?.username.charAt(0).toUpperCase() ?? '?');

	async function signOut() {
		await logout();
		router.push({ name: 'login', query: { mode: 'signout' } });
	}
</script>
