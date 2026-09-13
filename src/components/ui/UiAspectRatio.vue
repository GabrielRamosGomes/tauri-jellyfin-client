<template>
	<aspect-ratio
		:ratio="ratio"
		class="ui-aspect-ratio">
		<slot />
	</aspect-ratio>
</template>

<script setup lang="ts">
	import { AspectRatio } from 'reka-ui';

	withDefaults(defineProps<{ ratio?: number }>(), { ratio: 1 });
</script>
