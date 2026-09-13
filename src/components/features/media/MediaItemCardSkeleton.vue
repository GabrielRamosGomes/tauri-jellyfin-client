<template>
	<div
		class="media-item-skeleton"
		aria-hidden="true">
		<ui-aspect-ratio :ratio="2 / 3">
			<ui-skeleton
				height="100%"
				radius="8px" />
		</ui-aspect-ratio>
		<ui-skeleton
			width="80%"
			height="12px" />
		<ui-skeleton
			width="40%"
			height="10px" />
	</div>
</template>

<script setup lang="ts">
	import UiAspectRatio from '@/components/ui/UiAspectRatio.vue';
	import UiSkeleton from '@/components/ui/UiSkeleton.vue';
</script>
