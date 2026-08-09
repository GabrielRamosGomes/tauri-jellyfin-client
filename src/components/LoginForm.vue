<template>
	<form class="server-form" @submit.prevent="emit('submit')">
		<p class="server-meta">{{ serverInfo.ServerName }} ({{ serverInfo.Version }})</p>
		<div class="row">
			<input
				v-model="credentials.username"
				type="text"
				placeholder="Username"
				required
				:disabled="loading"
			/>
			<input
				v-model="credentials.password"
				type="password"
				placeholder="Password"
				:disabled="loading"
			/>
			<button type="submit" :disabled="loading">
				{{ loading ? 'Signing in...' : 'Sign in' }}
			</button>
		</div>

		<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
		<button type="button" class="link-btn" @click="emit('useDifferentServer')">
			Use a different server
		</button>
	</form>
</template>

<script setup lang="ts">
	import type { JellyfinUser } from '@/api/jellyfin/types';
	import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

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
