<template>
	<toggle-group-root
		type="single"
		orientation="vertical"
		loop
		class="alphabet-rail"
		aria-label="Filter by letter"
		:model-value="letter"
		:disabled="disabled"
		@update:model-value="select">
		<toggle-group-item
			v-for="option in [ALL_LETTERS, ...ALPHABET]"
			:key="option"
			:value="option"
			class="alphabet-rail-letter">
			{{ option }}
		</toggle-group-item>
	</toggle-group-root>
</template>

<script setup lang="ts">
	import { ALL_LETTERS, ALPHABET } from '@/composables/jellyfin/useLibraryQuery';
	import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui';

	defineProps<{ disabled?: boolean }>();
	const letter = defineModel<string>({ required: true });

	function select(value: unknown) {
		if (typeof value === 'string') letter.value = value;
	}
</script>
