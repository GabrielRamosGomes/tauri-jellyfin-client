<template>
	<div class="search-bar">
		<ui-input
			v-model="query"
			:icon="Search"
			placeholder="Search titles, people..."
			@keyup.enter="emit('submit', query)"
		/>
	</div>
</template>

<script setup lang="ts">
	import UiInput from '@/components/ui/UiInput.vue';
	import { Search } from 'lucide-vue-next';
	import { ref } from 'vue';

	const query = ref('');

	const emit = defineEmits<{ submit: [query: string] }>();
</script>
