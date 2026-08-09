<template>
	<form class="server-form" @submit.prevent="emit('submit')">
		<div class="row">
			<input
				v-model="serverUrl"
				type="url"
				placeholder="Server URL (e.g. http://192.168.1.5:8096)"
				required
				:disabled="loading"
			/>
			<button type="submit" :disabled="loading">
				{{ loading ? 'Testing...' : 'Connect' }}
			</button>
		</div>

		<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
	</form>
</template>

<script setup lang="ts">
	defineProps<{
		loading: boolean;
		errorMessage: string;
	}>();

	const emit = defineEmits<{ submit: [] }>();

	const serverUrl = defineModel<string>({ required: true });
</script>
