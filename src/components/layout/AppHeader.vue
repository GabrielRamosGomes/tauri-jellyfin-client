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
			<user-menu />
		</div>
	</header>
</template>

<script setup lang="ts">
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useNavDrawer } from '@/composables/ui/useNavDrawer';
	import { ArrowLeft, Heart, Home, Menu, Search } from 'lucide-vue-next';
	import { useRouter } from 'vue-router';

	import UserMenu from './UserMenu.vue';

	const router = useRouter();
	const { toggle } = useNavDrawer();
</script>
