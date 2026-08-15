<template>
	<button type="button" class="ui-icon-btn" :aria-label="label" :title="label" :disabled="disabled">
		<component :is="icon" :size="size" />
	</button>
</template>

<script setup lang="ts">
	import type { Component } from 'vue';

	withDefaults(
		defineProps<{
			icon: Component;
			label: string;
			disabled?: boolean;
			size?: number;
		}>(),
		{ disabled: false, size: 18 },
	);
</script>
