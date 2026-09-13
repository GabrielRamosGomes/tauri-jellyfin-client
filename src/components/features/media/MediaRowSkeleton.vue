<template>
	<section
		class="scrollable-row"
		aria-hidden="true">
		<div class="scrollable-row-header">
			<h2 class="scrollable-row-title">{{ title }}</h2>
		</div>

		<div class="scrollable-row-track">
			<div
				v-for="n in count"
				:key="n"
				class="media-row-card media-row-skeleton-card"
				:class="{ 'media-row-card--landscape': variant === 'landscape' }">
				<ui-aspect-ratio :ratio="variant === 'landscape' ? 16 / 9 : 2 / 3">
					<ui-skeleton
						height="100%"
						radius="8px" />
				</ui-aspect-ratio>
				<ui-skeleton
					width="70%"
					height="12px"
					class="media-row-skeleton-line" />
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import UiAspectRatio from '@/components/ui/UiAspectRatio.vue';
	import UiSkeleton from '@/components/ui/UiSkeleton.vue';

	withDefaults(defineProps<{ title: string; variant?: 'poster' | 'landscape'; count?: number }>(), {
		variant: 'poster',
		count: 6,
	});
</script>
