<template>
	<div
		class="ui-skeleton"
		:class="{ 'ui-skeleton--circle': circle, 'ui-skeleton--static': animation === 'none' }"
		:style="style"
		aria-hidden="true"
	/>
</template>

<script setup lang="ts">
	import { computed } from 'vue';

	const props = withDefaults(
		defineProps<{
			width?: string;
			height?: string;
			radius?: string;
			circle?: boolean;
			aspectRatio?: string;
			animation?: 'wave' | 'none';
		}>(),
		{ animation: 'wave' },
	);

	const style = computed(() => {
		const s: Record<string, string> = {};

		if (props.circle) {
			const size = props.width ?? props.height ?? '2rem';
			s.width = size;
			s.height = size;
			return s;
		}

		if (props.width) s.width = props.width;
		if (props.radius) s.borderRadius = props.radius;

		if (props.aspectRatio) {
			s.aspectRatio = props.aspectRatio;
			s.height = 'auto';
		} else if (props.height) {
			s.height = props.height;
		}

		return s;
	});
</script>
