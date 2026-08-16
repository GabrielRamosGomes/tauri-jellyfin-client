<template>
	<ui-scrollable-row title="Cast" :items="people" track-class="cast-row-track">
		<div v-for="person in people" :key="person.Id" class="cast-card">
			<div class="cast-avatar">
				<img v-if="imageUrl(person)" :src="imageUrl(person)" :alt="person.Name ?? ''" />
				<span v-else>{{ initials(person.Name) }}</span>
			</div>
			<p class="cast-name">{{ person.Name }}</p>
			<p v-if="person.Role" class="cast-role">{{ person.Role }}</p>
		</div>
	</ui-scrollable-row>
</template>

<script setup lang="ts">
	import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

	import UiScrollableRow from '@/components/ui/UiScrollableRow.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';

	defineProps<{ people: BaseItemPerson[] }>();
	const { personImageUrl } = useMediaImages();

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
