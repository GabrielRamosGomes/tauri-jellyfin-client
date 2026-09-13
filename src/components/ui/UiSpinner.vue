<template>
	<span
		class="ui-spinner"
		role="status"
		:aria-label="label"
		:style="{ width: `${size}px`, height: `${size}px`, borderWidth: `${borderWidth}px` }" />
</template>

<script setup lang="ts">
	import { computed } from 'vue';

	const props = withDefaults(defineProps<{ size?: number; label?: string }>(), {
		size: 32,
		label: 'Loading',
	});

	const borderWidth = computed(() => Math.max(2, Math.round(props.size / 12)));
</script>
