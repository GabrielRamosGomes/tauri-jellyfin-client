<template>
	<div>
		<h1>Home</h1>

		<section v-if="libraries.length">
			<h2>Libraries</h2>
			<div class="library-row">
				<library-card v-for="library in libraries" :key="library.Id" :library="library" />
			</div>
		</section>
		<p v-else class="server-meta">No libraries yet.</p>
	</div>
</template>

<script setup lang="ts">
	import LibraryCard from '@/components/LibraryCard.vue';
	import { useLibraries } from '@/composables/useLibraries';

	const { libraries } = useLibraries();
</script>
