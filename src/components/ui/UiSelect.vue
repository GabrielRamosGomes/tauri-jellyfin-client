<template>
	<select-root
		:model-value="modelValue"
		:disabled="disabled"
		@update:model-value="(value) => $emit('update:modelValue', value as string)"
	>
		<select-trigger class="ui-select-trigger">
			<select-value />
			<select-icon class="ui-select-icon">
				<chevron-down :size="16" />
			</select-icon>
		</select-trigger>

		<select-portal>
			<select-content class="ui-select-content" position="popper" :side-offset="4">
				<select-viewport>
					<select-item
						v-for="option in options"
						:key="option.value"
						:value="option.value"
						class="ui-select-item"
					>
						<select-item-text>{{ option.label }}</select-item-text>
						<select-item-indicator class="ui-select-item-indicator">
							<check :size="14" />
						</select-item-indicator>
					</select-item>
				</select-viewport>
			</select-content>
		</select-portal>
	</select-root>
</template>

<script setup lang="ts">
	import { Check, ChevronDown } from 'lucide-vue-next';
	import {
		SelectContent,
		SelectIcon,
		SelectItem,
		SelectItemIndicator,
		SelectItemText,
		SelectPortal,
		SelectRoot,
		SelectTrigger,
		SelectValue,
		SelectViewport,
	} from 'reka-ui';

	withDefaults(
		defineProps<{
			modelValue: string;
			options: { value: string; label: string }[];
			disabled?: boolean;
		}>(),
		{ disabled: false },
	);

	defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
