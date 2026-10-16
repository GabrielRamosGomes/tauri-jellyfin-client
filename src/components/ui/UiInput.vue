<template>
	<div class="ui-input-field">
		<label
			v-if="label"
			:for="inputId"
			class="ui-input-label"
			>{{ label }}</label
		>
		<div class="ui-input-wrapper">
			<component
				:is="icon"
				v-if="icon"
				:size="18"
				class="ui-input-icon" />
			<input
				:id="inputId"
				class="ui-input"
				:class="{ 'ui-input--has-icon': icon, 'ui-input--has-toggle': type === 'password' }"
				:type="resolvedType"
				:placeholder="placeholder"
				:value="modelValue"
				:disabled="disabled"
				:required="required"
				:aria-invalid="error ? true : undefined"
				:aria-describedby="error ? errorId : undefined"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />

			<button
				v-if="type === 'password'"
				type="button"
				class="ui-input-toggle"
				:aria-label="revealed ? 'Hide password' : 'Show password'"
				@click="revealed = !revealed">
				<eye-off
					v-if="revealed"
					:size="18" />
				<eye
					v-else
					:size="18" />
			</button>
		</div>
		<span
			v-if="error"
			:id="errorId"
			class="ui-input-error"
			>{{ error }}</span
		>
	</div>
</template>

<script setup lang="ts">
	import type { Component } from 'vue';

	import { Eye, EyeOff } from 'lucide-vue-next';
	import { computed, ref, useId } from 'vue';

	const props = withDefaults(
		defineProps<{
			modelValue: string;
			label?: string;
			type?: string;
			icon?: Component;
			placeholder?: string;
			disabled?: boolean;
			required?: boolean;
			error?: string;
		}>(),
		{ type: 'text', disabled: false, required: false },
	);

	defineEmits<{ 'update:modelValue': [value: string] }>();

	const inputId = useId();
	const errorId = `${inputId}-error`;

	const revealed = ref(false);

	const resolvedType = computed(() => {
		if (props.type !== 'password') return props.type;
		return revealed.value ? 'text' : 'password';
	});
</script>
