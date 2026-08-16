<template>
	<div class="item-detail-header">
		<div class="item-detail-header-overlay">
			<div class="item-detail-poster">
				<img v-if="posterUrl" :src="posterUrl" :alt="item.Name ?? ''" />
			</div>

			<div class="item-detail-info">
				<img v-if="logoUrl" :src="logoUrl" :alt="item.Name ?? ''" class="item-detail-logo" />
				<h1 v-else class="item-detail-title">{{ item.Name }}</h1>

				<div class="item-detail-meta">
					<span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
					<ui-badge v-if="item.OfficialRating">{{ item.OfficialRating }}</ui-badge>
					<span v-if="communityRating" class="item-detail-rating">
						<star :size="14" fill="currentColor" />
						{{ communityRating }}
					</span>
					<span v-if="runtimeMinutes">{{ runtimeMinutes }} min</span>
					<span v-if="endsAt">Ends at {{ endsAt }}</span>
				</div>

				<div v-if="item.Genres?.length" class="item-detail-genres">
					<ui-badge v-for="genre in item.Genres" :key="genre" variant="muted">{{ genre }}</ui-badge>
				</div>

				<p v-if="item.Overview" class="item-detail-overview">{{ item.Overview }}</p>

				<div class="item-detail-actions">
					<ui-button size="sm" class="item-detail-play-btn" @click="$emit('play')">
						<play :size="18" fill="currentColor" />
						Play
					</ui-button>

					<ui-icon-button
						:icon="Heart"
						:label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
						:disabled="pending"
						class="item-detail-action"
						:class="{ 'item-detail-action--favorite': isFavorite }"
						@click="toggleFavorite"
					/>
					<ui-icon-button
						:icon="Check"
						:label="isWatched ? 'Mark as unwatched' : 'Mark as watched'"
						:disabled="pending"
						class="item-detail-action"
						:class="{ 'item-detail-action--watched': isWatched }"
						@click="toggleWatched"
					/>

					<div v-if="item.ExternalUrls?.length" class="item-detail-links">
						<button
							v-for="(link, index) in item.ExternalUrls"
							:key="link.Name ?? index"
							type="button"
							class="item-detail-link"
							@click="openLink(link.Url)"
						>
							{{ link.Name }}
							<external-link :size="12" aria-hidden="true" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiBadge from '@/components/ui/UiBadge.vue';
	import UiButton from '@/components/ui/UiButton.vue';
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useItemActions } from '@/composables/jellyfin/useItemActions';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { Check, ExternalLink, Heart, Play, Star } from 'lucide-vue-next';
	import { computed, toRef } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	defineEmits<{ play: [] }>();
	const { libraryImageUrl, logoUrl: getLogoUrl } = useMediaImages();

	const itemRef = toRef(props, 'item');
	const { pending, toggleFavorite, toggleWatched } = useItemActions(itemRef);

	const isFavorite = computed(() => props.item.UserData?.IsFavorite ?? false);
	const isWatched = computed(() => props.item.UserData?.Played ?? false);

	const posterUrl = computed(() => libraryImageUrl(props.item));
	const logoUrl = computed(() => getLogoUrl(props.item));

	const runtimeMinutes = computed(() =>
		props.item.RunTimeTicks ? Math.round(props.item.RunTimeTicks / 600_000_000) : undefined,
	);

	const communityRating = computed(() => props.item.CommunityRating?.toFixed(1));

	// A quick "will this fit before bed" read, same idea as a delivery ETA.
	const endsAt = computed(() => {
		if (!runtimeMinutes.value) return undefined;

		const finishTime = new Date(Date.now() + runtimeMinutes.value * 60_000);
		return finishTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	});

	function openLink(url: string | null | undefined) {
		if (url) openUrl(url);
	}
</script>
