<template>
	<dl
		v-if="hasFacts"
		class="movie-facts">
		<div
			v-if="item.Genres?.length"
			class="movie-fact">
			<dt>Genres</dt>
			<dd>
				<ui-badge
					v-for="genre in item.Genres"
					:key="genre"
					variant="muted"
					>{{ genre }}</ui-badge
				>
			</dd>
		</div>
		<div
			v-if="directors.length"
			class="movie-fact">
			<dt>{{ directors.length > 1 ? 'Directors' : 'Director' }}</dt>
			<dd>
				<router-link
					v-for="person in directors"
					:key="person.Id"
					:to="{ name: 'person', params: { id: person.Id } }"
					class="movie-fact-link">
					<ui-badge variant="muted">{{ person.Name }}</ui-badge>
				</router-link>
			</dd>
		</div>
		<div
			v-if="writers.length"
			class="movie-fact">
			<dt>{{ writers.length > 1 ? 'Writers' : 'Writer' }}</dt>
			<dd>
				<router-link
					v-for="person in writers"
					:key="person.Id"
					:to="{ name: 'person', params: { id: person.Id } }"
					class="movie-fact-link">
					<ui-badge variant="muted">{{ person.Name }}</ui-badge>
				</router-link>
			</dd>
		</div>
		<div
			v-if="item.Studios?.length"
			class="movie-fact">
			<dt>Studios</dt>
			<dd>
				<ui-badge
					v-for="studio in item.Studios"
					:key="studio.Id ?? studio.Name ?? ''"
					variant="muted"
					>{{ studio.Name }}</ui-badge
				>
			</dd>
		</div>
	</dl>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiBadge from '@/components/ui/UiBadge.vue';
	import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models';
	import { computed } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();

	const directors = computed(
		() => props.item.People?.filter((p) => p.Type === PersonKind.Director) ?? [],
	);
	const writers = computed(
		() => props.item.People?.filter((p) => p.Type === PersonKind.Writer) ?? [],
	);

	const hasFacts = computed(
		() =>
			!!props.item.Genres?.length ||
			directors.value.length > 0 ||
			writers.value.length > 0 ||
			!!props.item.Studios?.length,
	);
</script>
