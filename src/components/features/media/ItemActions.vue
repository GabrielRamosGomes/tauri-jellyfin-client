<template>
	<ui-icon-button
		:icon="Heart"
		:size="size"
		:label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
		class="item-action"
		:class="{ 'ui-icon-btn--favorite': isFavorite }"
		@click.stop.prevent="toggleFavorite" />
	<ui-icon-button
		:icon="Check"
		:size="size"
		:label="isWatched ? 'Mark as unwatched' : 'Mark as watched'"
		class="item-action"
		:class="{ 'ui-icon-btn--watched': isWatched }"
		@click.stop.prevent="toggleWatched" />
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useItemActions } from '@/composables/jellyfin/useItemActions';
	import { Check, Heart } from 'lucide-vue-next';
	import { computed, toRef } from 'vue';

	// Shared favorite + watched toggles for any item. The two contexts (episode
	// card overlay, detail header) differ only in styling — supplied by the
	// parent via a container class and the .item-action hooks.
	const props = withDefaults(defineProps<{ item: BaseItemDto; size?: number }>(), { size: 18 });

	const { toggleFavorite, toggleWatched } = useItemActions(toRef(props, 'item'));

	const isFavorite = computed(() => props.item.UserData?.IsFavorite ?? false);
	const isWatched = computed(() => props.item.UserData?.Played ?? false);
</script>
