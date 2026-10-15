<template>
	<div
		class="ui-empty-state"
		role="status">
		<component
			:is="icon"
			:size="56"
			:stroke-width="1.5"
			class="ui-empty-state-icon"
			aria-hidden="true" />
		<p class="ui-empty-state-title">{{ title }}</p>
		<p
			v-if="description"
			class="ui-empty-state-desc">
			{{ description }}
		</p>
		<div
			v-if="$slots.default"
			class="ui-empty-state-actions">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { Component } from 'vue';

	import { Frown } from 'lucide-vue-next';

	withDefaults(defineProps<{ title: string; description?: string; icon?: Component }>(), {
		icon: () => Frown,
	});
</script>
