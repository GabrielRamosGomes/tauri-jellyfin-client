<template>
	<div>
		<hero-banner
			v-if="heroItem"
			:item="heroItem" />

		<template v-if="showSkeleton">
			<media-row-skeleton
				title="My Collection"
				variant="landscape" />
			<media-row-skeleton
				title="Up Next"
				variant="landscape" />
			<media-row-skeleton
				title="Continue Watching"
				variant="landscape" />
			<media-row-skeleton
				title="Latest"
				variant="poster" />
		</template>

		<template v-else>
			<media-row
				title="My Collection"
				:items="libraries"
				variant="library" />
			<ui-empty-state
				v-if="!libraries.length"
				title="No libraries yet"
				description="Add a library on your Jellyfin server to get started."
				:icon="LibraryBig" />

			<media-row
				title="Up Next"
				:items="nextUp"
				variant="landscape" />
			<media-row
				title="Continue Watching"
				:items="continueWatching"
				variant="landscape" />
			<media-row
				v-for="section in latestByLibrary"
				:key="section.libraryId"
				:title="`Latest ${section.libraryName}`"
				:items="section.items" />
		</template>
	</div>
</template>

<script setup lang="ts">
	import HeroBanner from '@/components/features/item-detail/HeroBanner.vue';
	import MediaRow from '@/components/features/media/MediaRow.vue';
	import MediaRowSkeleton from '@/components/features/media/MediaRowSkeleton.vue';
	import UiEmptyState from '@/components/ui/UiEmptyState.vue';
	import { useHomeSections } from '@/composables/jellyfin/useHomeSections';
	import { useLibraries } from '@/composables/jellyfin/useLibraries';
	import { LibraryBig } from 'lucide-vue-next';
	import { computed, onMounted, watch } from 'vue';

	const { libraries } = useLibraries();
	const {
		loading,
		continueWatching,
		nextUp,
		latestByLibrary,
		heroItem,
		refreshUserSections,
		refreshLibrarySections,
	} = useHomeSections();

	const showSkeleton = computed(
		() =>
			loading.value &&
			!libraries.value.length &&
			!continueWatching.value.length &&
			!nextUp.value.length &&
			!latestByLibrary.value.length,
	);

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
