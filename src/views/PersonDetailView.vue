<template>
	<person-detail-layout v-if="person" :person="person">
		<person-header :person="person" />
		<person-filmography :person-id="personId" />
	</person-detail-layout>
	<p v-else-if="loading" class="server-meta">Loading...</p>
	<p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
</template>

<script setup lang="ts">
	import PersonDetailLayout from '@/components/features/person/PersonDetailLayout.vue';
	import PersonFilmography from '@/components/features/person/PersonFilmography.vue';
	import PersonHeader from '@/components/features/person/PersonHeader.vue';
	import { useItemDetail } from '@/composables/jellyfin/useItemDetail';
	import { computed } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const personId = computed(() => route.params.id as string);
	const { item: person, loading, errorMessage } = useItemDetail(personId);
</script>
