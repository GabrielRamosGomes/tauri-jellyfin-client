<template>
	<div class="media-item-skeleton" aria-hidden="true">
		<ui-skeleton aspect-ratio="2 / 3" radius="8px" />
		<ui-skeleton width="80%" height="12px" />
		<ui-skeleton width="40%" height="10px" />
	</div>
</template>

<script setup lang="ts">
	import UiSkeleton from '@/components/ui/UiSkeleton.vue';
</script>
