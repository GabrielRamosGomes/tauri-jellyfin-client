<template>
	<dialog-root v-model:open="open">
		<dialog-portal>
			<dialog-overlay class="add-server-overlay" />
			<dialog-content class="add-server-dialog">
				<monitor-up
					:size="32"
					class="add-server-dialog-icon"
					aria-hidden="true" />
				<dialog-title class="add-server-dialog-title">Connect to Server</dialog-title>
				<dialog-description class="server-meta">
					Enter your Jellyfin server address to continue
				</dialog-description>

				<form
					class="add-server-dialog-form"
					@submit.prevent="emit('submit')">
					<ui-input
						v-model="serverUrl"
						type="url"
						:icon="Server"
						placeholder="https://jellyfin.example.com"
						required
						:disabled="loading" />

					<p
						v-if="errorMessage"
						class="error-msg">
						{{ errorMessage }}
					</p>

					<div class="add-server-dialog-actions">
						<dialog-close as-child>
							<ui-button
								variant="ghost"
								:disabled="loading">
								Cancel
							</ui-button>
						</dialog-close>
						<ui-button
							type="submit"
							:loading="loading"
							:disabled="!serverUrl.trim()">
							{{ loading ? 'Connecting...' : 'Connect' }}
						</ui-button>
					</div>
				</form>
			</dialog-content>
		</dialog-portal>
	</dialog-root>
</template>

<script setup lang="ts">
	import UiButton from '@/components/ui/UiButton.vue';
	import UiInput from '@/components/ui/UiInput.vue';
	import { MonitorUp, Server } from 'lucide-vue-next';
	import {
		DialogClose,
		DialogContent,
		DialogDescription,
		DialogOverlay,
		DialogPortal,
		DialogRoot,
		DialogTitle,
	} from 'reka-ui';

	defineProps<{ loading: boolean; errorMessage: string }>();
	const emit = defineEmits<{ submit: [] }>();

	const open = defineModel<boolean>('open', { required: true });
	const serverUrl = defineModel<string>('url', { required: true });
</script>
