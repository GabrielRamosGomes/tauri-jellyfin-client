<template>
	<section v-if="hasItems" class="scrollable-row">
		<div class="scrollable-row-header">
			<h2 class="scrollable-row-title">{{ title }}</h2>
			<div v-if="canScrollLeft || canScrollRight" class="scrollable-row-controls">
				<ui-icon-button
					:icon="ChevronLeft"
					label="Scroll left"
					:disabled="!canScrollLeft"
					@click="scroll(-1)"
				/>
				<ui-icon-button
					:icon="ChevronRight"
					label="Scroll right"
					:disabled="!canScrollRight"
					@click="scroll(1)"
				/>
			</div>
		</div>

		<div ref="trackRef" class="scrollable-row-track" :class="trackClass">
			<slot />
		</div>
	</section>
</template>

<script setup lang="ts">
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useScrollTrack } from '@/composables/ui/useScrollTrack';
	import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
	import { computed } from 'vue';

	const props = defineProps<{
		title: string;
		items: unknown[];
		trackClass?: string;
	}>();

	const items = computed(() => props.items);
	const hasItems = computed(() => props.items.length > 0);
	// oxlint-ignore-next-line typescript/no-unused-vars -- trackRef is used as a template ref
	const { trackRef, canScrollLeft, canScrollRight, scroll } = useScrollTrack(items);
</script>
