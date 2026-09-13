<template>
	<div class="episode-skeleton" aria-hidden="true">
		<ui-aspect-ratio :ratio="16 / 9">
			<ui-skeleton height="100%" radius="10px" />
		</ui-aspect-ratio>
		<div class="episode-skeleton-info">
			<ui-skeleton width="70%" height="14px" />
			<ui-skeleton width="40%" height="10px" />
			<ui-skeleton width="100%" height="10px" />
			<ui-skeleton width="80%" height="10px" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import UiAspectRatio from '@/components/ui/UiAspectRatio.vue';
	import UiSkeleton from '@/components/ui/UiSkeleton.vue';
</script>
