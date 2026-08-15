<template>
	<button
		:type="type"
		class="ui-btn"
		:class="[`ui-btn--${variant}`, `ui-btn--${size}`]"
		:disabled="disabled"
	>
		<slot />
	</button>
</template>

<script setup lang="ts">
	withDefaults(
		defineProps<{
			variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
			size?: 'sm' | 'md';
			type?: 'button' | 'submit' | 'reset';
			disabled?: boolean;
		}>(),
		{ variant: 'primary', size: 'md', type: 'button', disabled: false },
	);
</script>
