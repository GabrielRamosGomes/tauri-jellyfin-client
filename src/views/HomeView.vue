<template>
	<div>
		<media-row title="My Collection" :items="libraries" variant="library" />
		<p v-if="!libraries.length" class="server-meta">No libraries yet.</p>

		<!-- <media-row title="Favourites" :items="favorites" /> -->
		<media-row title="Up Next" :items="nextUp" variant="landscape" />
		<media-row title="Continue Watching" :items="continueWatching" variant="landscape" />
		<media-row
			v-for="section in latestByLibrary"
			:key="section.libraryId"
			:title="`Latest ${section.libraryName}`"
			:items="section.items"
		/>
	</div>
</template>

<script setup lang="ts">
	import MediaRow from '@/components/MediaRow.vue';
	import { useHomeSections } from '@/composables/useHomeSections';
	import { useLibraries } from '@/composables/useLibraries';
	import { watch } from 'vue';

	const { libraries } = useLibraries();
	const { continueWatching, nextUp, latestByLibrary, refresh } = useHomeSections();

	watch(
		libraries,
		(current) => {
			if (current.length) refresh(current);
		},
		{ immediate: true },
	);
</script>
