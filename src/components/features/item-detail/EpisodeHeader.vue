<template>
	<div class="item-detail-header episode-header">
		<div class="item-detail-header-overlay">
			<div class="episode-aside">
				<div class="episode-detail-thumb">
					<ui-aspect-ratio :ratio="16 / 9">
						<img
							v-if="thumbUrl"
							:src="thumbUrl"
							:alt="item.Name ?? ''" />
					</ui-aspect-ratio>
				</div>

				<aside
					v-if="videoLabel || hasAudio || hasSubtitles"
					class="episode-media-panel">
					<h2 class="episode-media-title">Media</h2>

					<div
						v-if="videoLabel"
						class="episode-media-static">
						<film
							:size="18"
							class="ui-dropdown-icon" />
						<span class="ui-dropdown-value">{{ videoLabel }}</span>
					</div>

					<ui-dropdown
						v-if="hasAudio"
						v-model="selectedAudio"
						:options="audioOptions"
						:icon="Volume2"
						aria-label="Audio track" />

					<ui-dropdown
						v-if="hasSubtitles"
						v-model="selectedSubtitle"
						:options="subtitleOptions"
						:icon="Captions"
						aria-label="Subtitles" />
				</aside>
			</div>

			<div class="item-detail-info">
				<router-link
					v-if="item.SeriesName && item.SeriesId"
					class="season-kicker"
					:to="{ name: 'item', params: { id: item.SeriesId } }">
					{{ item.SeriesName }}
				</router-link>

				<div class="season-title-row">
					<component
						:is="prevEpisode ? 'router-link' : 'span'"
						v-if="hasSiblings"
						class="season-nav"
						:class="{ 'season-nav--disabled': !prevEpisode }"
						:to="prevEpisode ? { name: 'item', params: { id: prevEpisode.Id } } : undefined"
						:aria-label="prevEpisode ? `Go to ${prevEpisode.Name}` : undefined">
						<chevron-left :size="20" />
					</component>

					<h1 class="item-detail-title">{{ episodeLabel }}{{ item.Name }}</h1>

					<component
						:is="nextEpisode ? 'router-link' : 'span'"
						v-if="hasSiblings"
						class="season-nav"
						:class="{ 'season-nav--disabled': !nextEpisode }"
						:to="nextEpisode ? { name: 'item', params: { id: nextEpisode.Id } } : undefined"
						:aria-label="nextEpisode ? `Go to ${nextEpisode.Name}` : undefined">
						<chevron-right :size="20" />
					</component>
				</div>

				<div class="item-detail-meta">
					<ui-badge v-if="resolutionLabel">{{ resolutionLabel }}</ui-badge>
					<ui-badge v-if="videoRange">{{ videoRange }}</ui-badge>
					<span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
					<ui-badge v-if="item.OfficialRating">{{ item.OfficialRating }}</ui-badge>
					<span
						v-if="communityRating"
						class="item-detail-rating">
						<star
							:size="14"
							fill="currentColor" />
						{{ communityRating }}
					</span>
					<span v-if="runtimeMinutes">{{ runtimeMinutes }} min</span>
					<span v-if="endsAt">Ends at {{ endsAt }}</span>
				</div>

				<p
					v-if="item.Overview"
					class="item-detail-overview">
					{{ item.Overview }}
				</p>

				<div class="item-detail-actions">
					<ui-button
						size="sm"
						class="item-detail-play-btn"
						@click="$emit('play')">
						<play
							:size="18"
							fill="currentColor" />
						Play
					</ui-button>

					<item-actions :item="item" />

					<div
						v-if="item.ExternalUrls?.length"
						class="item-detail-links">
						<button
							v-for="(link, index) in item.ExternalUrls"
							:key="link.Name ?? index"
							type="button"
							class="item-detail-link"
							@click="openLink(link.Url)">
							{{ link.Name }}
							<external-link
								:size="12"
								aria-hidden="true" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import ItemActions from '@/components/features/media/ItemActions.vue';
	import UiAspectRatio from '@/components/ui/UiAspectRatio.vue';
	import UiBadge from '@/components/ui/UiBadge.vue';
	import UiButton from '@/components/ui/UiButton.vue';
	import UiDropdown from '@/components/ui/UiDropdown.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useMediaStreams } from '@/composables/jellyfin/useMediaStreams';
	import { useSeasonEpisodes } from '@/composables/jellyfin/useSeasonEpisodes';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import {
		Captions,
		ChevronLeft,
		ChevronRight,
		ExternalLink,
		Film,
		Play,
		Star,
		Volume2,
	} from 'lucide-vue-next';
	import { computed, toRef } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	defineEmits<{ play: [] }>();

	const { landscapeImageUrl } = useMediaImages();
	const {
		videoLabel,
		resolutionLabel,
		videoRange,
		audioOptions,
		subtitleOptions,
		selectedAudio,
		selectedSubtitle,
		hasAudio,
		hasSubtitles,
	} = useMediaStreams(toRef(props, 'item'));

	const thumbUrl = computed(() => landscapeImageUrl(props.item));
	const communityRating = computed(() => props.item.CommunityRating?.toFixed(1));

	const episodeLabel = computed(() => {
		const season = props.item.ParentIndexNumber;
		const episode = props.item.IndexNumber;
		return season != null && episode != null ? `S${season}:E${episode} · ` : '';
	});

	// --- Prev / next episode within the season ---
	const seasonId = computed(() => props.item.SeasonId ?? '');
	const seasonNumber = computed(() => props.item.ParentIndexNumber ?? undefined);
	const { episodes } = useSeasonEpisodes(seasonId, seasonNumber);

	const hasSiblings = computed(() => episodes.value.length > 1);
	const currentIndex = computed(() => episodes.value.findIndex((e) => e.Id === props.item.Id));
	const prevEpisode = computed(() =>
		currentIndex.value > 0 ? episodes.value[currentIndex.value - 1] : undefined,
	);
	const nextEpisode = computed(() =>
		currentIndex.value >= 0 && currentIndex.value < episodes.value.length - 1
			? episodes.value[currentIndex.value + 1]
			: undefined,
	);

	const runtimeMinutes = computed(() =>
		props.item.RunTimeTicks ? Math.round(props.item.RunTimeTicks / 600_000_000) : undefined,
	);

	const endsAt = computed(() => {
		if (!runtimeMinutes.value) return undefined;

		const finishTime = new Date(Date.now() + runtimeMinutes.value * 60_000);
		return finishTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	});

	function openLink(url: string | null | undefined) {
		if (url) openUrl(url);
	}
</script>
