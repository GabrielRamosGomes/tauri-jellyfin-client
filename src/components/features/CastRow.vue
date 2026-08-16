<template>
	<section v-if="people.length" class="cast-row">
		<div class="media-row-header">
			<h2 class="media-row-title">Cast</h2>
			<div class="media-row-controls">
				<ui-icon-button
					:icon="ChevronLeft"
					label="Scroll left"
					:disabled="!canScrollLeft"
					@click="scroll(-1)"
				/>
				<ui-icon-button
					:icon="ChevronRight"
					label="Scroll right"
					:disabled="!canScrollRight"
					@click="scroll(1)"
				/>
			</div>
		</div>

		<div ref="trackRef" class="media-row-track cast-row-track">
			<div v-for="person in people" :key="person.Id" class="cast-card">
				<div class="cast-avatar">
					<img v-if="imageUrl(person)" :src="imageUrl(person)" :alt="person.Name ?? ''" />
					<span v-else>{{ initials(person.Name) }}</span>
				</div>
				<p class="cast-name">{{ person.Name }}</p>
				<p v-if="person.Role" class="cast-role">{{ person.Role }}</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useScrollTrack } from '@/composables/ui/useScrollTrack';
	import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
	import { computed } from 'vue';

	const props = defineProps<{ people: BaseItemPerson[] }>();
	const { personImageUrl } = useMediaImages();

	const people = computed(() => props.people);
	const { trackRef, canScrollLeft, canScrollRight, scroll } = useScrollTrack(people);

	function imageUrl(person: BaseItemPerson) {
		return personImageUrl(person);
	}

	function initials(name: string | null | undefined) {
		if (!name) return '?';

		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('');
	}
</script>
