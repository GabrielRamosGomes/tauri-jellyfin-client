<template>
	<form class="server-form" @submit.prevent="emit('submit')">
		<div class="row">
			<ui-input
				v-model="serverUrl"
				type="url"
				placeholder="Server URL (e.g. http://192.168.1.5:8096)"
				required
				:disabled="loading"
			/>
			<ui-button type="submit" :disabled="loading">
				{{ loading ? 'Testing...' : 'Connect' }}
			</ui-button>
		</div>

		<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
	</form>
</template>

<script setup lang="ts">
	import UiButton from '@/components/ui/UiButton.vue';
	import UiInput from '@/components/ui/UiInput.vue';

	defineProps<{
		loading: boolean;
		errorMessage: string;
	}>();

	const emit = defineEmits<{ submit: [] }>();

	const serverUrl = defineModel<string>({ required: true });
</script>
