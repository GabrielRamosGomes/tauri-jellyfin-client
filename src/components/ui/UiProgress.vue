<template>
	<progress-root
		:model-value="percent"
		class="ui-progress">
		<progress-indicator
			class="ui-progress-indicator"
			:style="{ transform: `translateX(-${100 - percent}%)` }" />
	</progress-root>
</template>

<script setup lang="ts">
	import { ProgressIndicator, ProgressRoot } from 'reka-ui';
	import { computed } from 'vue';

	const props = withDefaults(defineProps<{ value?: number; max?: number }>(), {
		value: 0,
		max: 100,
	});

	const percent = computed(() => {
		const pct = (props.value / props.max) * 100;
		return Math.max(0, Math.min(100, Math.round(pct)));
	});
</script>
