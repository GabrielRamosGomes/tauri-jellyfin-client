<template>
	<popover-root>
		<popover-trigger
			class="ui-dropdown-trigger genre-filter-trigger"
			:disabled="disabled || !genres.length"
			aria-label="Filter by genre">
			<drama
				:size="18"
				class="ui-dropdown-icon" />
			<span class="ui-dropdown-value">Genre</span>
			<span
				v-if="selected.length"
				class="genre-filter-count"
				>{{ selected.length }}</span
			>
			<chevron-down
				:size="16"
				class="ui-dropdown-chevron" />
		</popover-trigger>

		<popover-portal>
			<popover-content
				class="genre-filter-content"
				align="end"
				:side-offset="6">
				<div class="genre-filter-header">
					<span>Genres</span>
					<button
						v-if="selected.length"
						type="button"
						class="genre-filter-clear"
						@click="selected = []">
						Clear
					</button>
				</div>

				<toggle-group-root
					type="multiple"
					class="genre-filter-list"
					:model-value="selected"
					:disabled="disabled"
					@update:model-value="select">
					<toggle-group-item
						v-for="genre in genres"
						:key="genre.Id"
						:value="genre.Id"
						class="genre-filter-chip">
						{{ genre.Name }}
					</toggle-group-item>
				</toggle-group-root>
			</popover-content>
		</popover-portal>
	</popover-root>
</template>

<script setup lang="ts">
	import type { LibraryGenre } from '@/api/jellyfin/library';

	import { ChevronDown, Drama } from 'lucide-vue-next';
	import {
		PopoverContent,
		PopoverPortal,
		PopoverRoot,
		PopoverTrigger,
		ToggleGroupItem,
		ToggleGroupRoot,
	} from 'reka-ui';

	defineProps<{ genres: LibraryGenre[]; disabled?: boolean }>();
	const selected = defineModel<string[]>({ required: true });

	function select(value: unknown) {
		if (Array.isArray(value)) selected.value = value.filter((id) => typeof id === 'string');
	}
</script>
