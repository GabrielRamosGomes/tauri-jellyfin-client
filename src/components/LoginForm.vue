<template>
	<form class="server-form login-form" @submit.prevent="emit('submit')">
		<h1 class="login-title">Login</h1>
		<p class="server-meta login-subtitle">{{ serverInfo.ServerName }} ({{ serverInfo.Version }})</p>

		<ui-input
			v-model="credentials.username"
			:icon="User"
			label="Username"
			placeholder="Username"
			required
			:disabled="loading"
		/>
		<ui-input
			v-model="credentials.password"
			:icon="KeyRound"
			type="password"
			label="Password"
			placeholder="Password"
			:disabled="loading"
		/>

		<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

		<ui-button type="submit" :disabled="loading">
			{{ loading ? 'Signing in...' : 'Login' }}
		</ui-button>

		<ui-button
			variant="ghost"
			size="sm"
			class="login-change-server"
			@click="emit('useDifferentServer')"
		>
			Change Server
		</ui-button>
	</form>
</template>

<script setup lang="ts">
	import type { JellyfinUser } from '@/api/jellyfin/types';
	import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

	import UiButton from '@/components/ui/UiButton.vue';
	import UiInput from '@/components/ui/UiInput.vue';
	import { KeyRound, User } from 'lucide-vue-next';

	defineProps<{
		serverInfo: PublicSystemInfo;
		loading: boolean;
		errorMessage: string;
	}>();

	const emit = defineEmits<{
		submit: [];
		useDifferentServer: [];
	}>();

	const credentials = defineModel<JellyfinUser>({ required: true });
</script>
