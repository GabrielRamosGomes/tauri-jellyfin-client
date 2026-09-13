<template>
	<tabs-root v-if="groups.length" v-model="activeTab" class="person-tabs">
		<tabs-list class="person-tabs-list">
			<tabs-trigger
				v-for="group in groups"
				:key="group.key"
				:value="group.key"
				class="person-tabs-trigger"
			>
				{{ group.label }}
			</tabs-trigger>
		</tabs-list>

		<tabs-content
			v-for="group in groups"
			:key="group.key"
			:value="group.key"
			class="person-tabs-content"
		>
			<div class="person-grid" :class="{ 'person-grid--landscape': group.key === 'episodes' }">
				<component
					:is="group.key === 'episodes' ? MediaEpisodeCard : MediaItemCard"
					v-for="item in group.items"
					:key="item.Id"
					:item="item"
					class="person-grid-card"
				/>
			</div>
		</tabs-content>
	</tabs-root>

	<p v-else-if="loading" class="server-meta">Loading...</p>
</template>

<script setup lang="ts">
	import MediaEpisodeCard from '@/components/features/media/MediaEpisodeCard.vue';
	import MediaItemCard from '@/components/features/media/MediaItemCard.vue';
	import { usePersonFilmography } from '@/composables/jellyfin/usePersonFilmography';
	import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';
	import { ref, toRef, watch } from 'vue';

	const props = defineProps<{ personId: string }>();

	const { groups, loading } = usePersonFilmography(toRef(props, 'personId'));

	const activeTab = ref('');

	// Keep a valid tab selected as data streams in / the person changes.
	watch(
		groups,
		(value) => {
			if (!value.some((group) => group.key === activeTab.value)) {
				activeTab.value = value[0]?.key ?? '';
			}
		},
		{ immediate: true },
	);
</script>
