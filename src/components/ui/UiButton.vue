<template>
	<button
		:type="type"
		class="ui-btn"
		:class="[`ui-btn--${variant}`, `ui-btn--${size}`]"
		:disabled="disabled || loading">
		<ui-spinner
			v-if="loading"
			:size="size === 'sm' ? 14 : 16" />
		<slot />
	</button>
</template>

<script setup lang="ts">
	import UiSpinner from '@/components/ui/UiSpinner.vue';

	withDefaults(
		defineProps<{
			variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
			size?: 'sm' | 'md';
			type?: 'button' | 'submit' | 'reset';
			disabled?: boolean;
			loading?: boolean;
		}>(),
		{ variant: 'primary', size: 'md', type: 'button', disabled: false, loading: false },
	);
</script>
