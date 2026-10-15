<template>
	<div class="library-toolbar">
		<ui-dropdown
			:model-value="watched"
			:options="WATCHED_OPTIONS"
			:icon="Eye"
			:disabled="disabled"
			aria-label="Watched status"
			@update:model-value="watched = $event as WatchedFilter" />
		<genre-filter
			v-model="genreIds"
			:genres="genres"
			:disabled="disabled" />

		<div class="library-toolbar-sort">
			<ui-dropdown
				:model-value="sortKey"
				:options="SORT_OPTIONS"
				:icon="ArrowDownUp"
				:disabled="disabled"
				aria-label="Sort by"
				@update:model-value="$emit('update:sortKey', $event as LibrarySortKey)" />
			<ui-icon-button
				:icon="ascending ? ArrowUpNarrowWide : ArrowDownWideNarrow"
				:label="ascending ? 'Ascending' : 'Descending'"
				:disabled="disabled"
				@click="$emit('toggleOrder')" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { LibraryGenre } from '@/api/jellyfin/library';
	import type { LibrarySortKey, WatchedFilter } from '@/composables/jellyfin/useLibraryQuery';

	import GenreFilter from '@/components/features/library/GenreFilter.vue';
	import UiDropdown from '@/components/ui/UiDropdown.vue';
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { ArrowDownUp, ArrowDownWideNarrow, ArrowUpNarrowWide, Eye } from 'lucide-vue-next';

	defineProps<{
		sortKey: LibrarySortKey;
		ascending: boolean;
		genres: LibraryGenre[];
		disabled?: boolean;
	}>();
	defineEmits<{ 'update:sortKey': [key: LibrarySortKey]; toggleOrder: [] }>();
	const watched = defineModel<WatchedFilter>('watched', { required: true });
	const genreIds = defineModel<string[]>('genreIds', { required: true });

	const SORT_OPTIONS: { value: LibrarySortKey; label: string }[] = [
		{ value: 'name', label: 'Name' },
		{ value: 'dateAdded', label: 'Date added' },
		{ value: 'releaseDate', label: 'Release date' },
		{ value: 'rating', label: 'Rating' },
	];

	const WATCHED_OPTIONS: { value: WatchedFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'unwatched', label: 'Unwatched' },
		{ value: 'watched', label: 'Watched' },
	];
</script>
