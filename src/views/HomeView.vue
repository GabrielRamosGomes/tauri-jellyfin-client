<template>
	<div>
		<hero-banner v-if="heroItem" :item="heroItem" />

		<media-row title="My Collection" :items="libraries" variant="library" />
		<p v-if="!libraries.length" class="server-meta">No libraries yet.</p>

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
	import HeroBanner from '@/components/features/item-detail/HeroBanner.vue';
	import MediaRow from '@/components/features/media/MediaRow.vue';
	import { useHomeSections } from '@/composables/jellyfin/useHomeSections';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { onMounted, watch } from 'vue';

	const { libraries } = useLibraries();
	const {
		continueWatching,
		nextUp,
		latestByLibrary,
		heroItem,
		refreshUserSections,
		refreshLibrarySections,
	} = useHomeSections();

	onMounted(() => {
		refreshUserSections();
	});

	watch(
		libraries,
		(current) => {
			if (current.length) refreshLibrarySections(current);
		},
		{ immediate: true },
	);
</script>
