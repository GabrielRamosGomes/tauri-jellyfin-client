<template>
	<label class="ui-input-field">
		<span v-if="label" class="ui-input-label">{{ label }}</span>
		<div class="ui-input-wrapper">
			<component :is="icon" v-if="icon" :size="18" class="ui-input-icon" />
			<input
				class="ui-input"
				:class="{ 'ui-input--has-icon': icon, 'ui-input--has-toggle': type === 'password' }"
				:type="resolvedType"
				:placeholder="placeholder"
				:value="modelValue"
				:disabled="disabled"
				:required="required"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
			<button
				v-if="type === 'password'"
				type="button"
				class="ui-input-toggle"
				:aria-label="revealed ? 'Hide password' : 'Show password'"
				@click="revealed = !revealed"
			>
				<eye-off v-if="revealed" :size="18" />
				<eye v-else :size="18" />
			</button>
		</div>
		<span v-if="error" class="ui-input-error">{{ error }}</span>
	</label>
</template>

<script setup lang="ts">
	import type { Component } from 'vue';

	import { Eye, EyeOff } from 'lucide-vue-next';
	import { computed, ref } from 'vue';

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

	const revealed = ref(false);

	const resolvedType = computed(() => {
		if (props.type !== 'password') return props.type;
		return revealed.value ? 'text' : 'password';
	});
</script>
