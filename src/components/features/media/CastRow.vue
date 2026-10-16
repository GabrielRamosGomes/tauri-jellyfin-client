<template>
	<ui-scrollable-row
		title="Cast"
		:items="cast"
		track-class="cast-row-track">
		<router-link
			v-for="person in cast"
			:key="person.Id"
			:to="{ name: 'person', params: { id: person.Id } }"
			class="cast-card">
			<div class="cast-avatar">
				<img
					v-if="imageUrl(person)"
					:src="imageUrl(person)"
					:alt="person.Name ?? ''"
					@error="onImageError(person)" />
				<span v-else>{{ getInitials(person.Name) }}</span>
			</div>
			<p class="cast-name">{{ person.Name }}</p>
			<p
				v-if="person.Role"
				class="cast-role">
				{{ person.Role }}
			</p>
		</router-link>
	</ui-scrollable-row>
</template>

<script setup lang="ts">
	import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';

	import UiScrollableRow from '@/components/ui/UiScrollableRow.vue';
	import { usePersonImages } from '@/composables/jellyfin/usePersonImages';
	import { getInitials } from '@/utils/format';
	import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models';
	import { computed } from 'vue';

	const props = defineProps<{ people: BaseItemPerson[] }>();
	const { imageUrl, onImageError } = usePersonImages();

	const cast = computed(() =>
		props.people.filter(
			(person) => person.Type === PersonKind.Actor || person.Type === PersonKind.GuestStar,
		),
	);
</script>
