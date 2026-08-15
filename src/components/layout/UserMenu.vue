<template>
	<dropdown-menu-root v-if="session">
		<dropdown-menu-trigger class="ui-avatar app-header-avatar" title="Account">
			<img v-if="avatarUrl && !avatarFailed" :src="avatarUrl" alt="" @error="avatarFailed = true" />
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
			</dropdown-menu-content>
		</dropdown-menu-portal>
	</dropdown-menu-root>
</template>

<script setup lang="ts">
	import { useAuthSession } from '@/composables/jellyfin/useAuthSession';
	import { useUserProfile } from '@/composables/jellyfin/useUserProfile';
	import { LogOut, Server, Settings } from 'lucide-vue-next';
	import {
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuPortal,
		DropdownMenuRoot,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from 'reka-ui';
	import { computed, ref } from 'vue';
	import { useRouter } from 'vue-router';

	const router = useRouter();
	const { session, logout } = useAuthSession();
	const { avatarUrl } = useUserProfile();

	const avatarFailed = ref(false);

	const accountInitial = computed(() => session.value?.username.charAt(0).toUpperCase() ?? '?');

	async function signOut() {
		await logout();
		router.push({ name: 'login', query: { mode: 'signout' } });
	}
</script>
