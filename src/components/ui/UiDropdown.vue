<template>
	<select-root
		:model-value="modelValue"
		:disabled="disabled"
		@update:model-value="(value) => $emit('update:modelValue', value as string)">
		<select-trigger
			class="ui-dropdown-trigger"
			:aria-label="ariaLabel">
			<component
				:is="icon"
				v-if="icon"
				:size="18"
				class="ui-dropdown-icon" />
			<span class="ui-dropdown-value">
				<select-value :placeholder="placeholder" />
			</span>
			<chevron-down
				:size="16"
				class="ui-dropdown-chevron" />
		</select-trigger>

		<select-portal>
			<select-content
				class="ui-dropdown-content"
				position="popper"
				:side-offset="6">
				<select-viewport>
					<select-item
						v-for="option in options"
						:key="option.value"
						:value="option.value"
						class="ui-dropdown-item">
						<span class="ui-dropdown-item-body">
							<select-item-text>{{ option.label }}</select-item-text>
							<span
								v-if="option.description"
								class="ui-dropdown-item-desc">
								{{ option.description }}
							</span>
						</span>
						<select-item-indicator class="ui-dropdown-item-indicator">
							<check :size="16" />
						</select-item-indicator>
					</select-item>
				</select-viewport>
			</select-content>
		</select-portal>
	</select-root>
</template>

<script setup lang="ts">
	import type { Component } from 'vue';

	import { Check, ChevronDown } from 'lucide-vue-next';
	import {
		SelectContent,
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
			options: { value: string; label: string; description?: string }[];
			icon?: Component;
			placeholder?: string;
			ariaLabel?: string;
			disabled?: boolean;
		}>(),
		{ disabled: false },
	);

	defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
