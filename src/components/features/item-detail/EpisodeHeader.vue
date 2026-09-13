<template>
	<div class="item-detail-header movie-header episode-header">
		<div class="movie-header-content">
			<div class="episode-top">
				<div class="episode-still">
					<ui-aspect-ratio :ratio="16 / 9">
						<img
							v-if="thumbUrl"
							:src="thumbUrl"
							:alt="item.Name ?? ''" />
					</ui-aspect-ratio>
				</div>

				<div class="episode-headline">
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

			<div
				v-if="videoLabel || hasAudio || hasSubtitles"
				class="movie-tracks">
				<div
					v-if="videoLabel"
					class="movie-track-row">
					<span class="movie-track-label">Video</span>
					<span class="movie-track-static">
						<film :size="16" />
						{{ videoLabel }}
					</span>
				</div>
				<div
					v-if="hasAudio"
					class="movie-track-row">
					<span class="movie-track-label">Audio</span>
					<ui-dropdown
						v-model="selectedAudio"
						:options="audioOptions"
						:icon="Volume2"
						aria-label="Audio track" />
				</div>
				<div
					v-if="hasSubtitles"
					class="movie-track-row">
					<span class="movie-track-label">Subtitles</span>
					<ui-dropdown
						v-model="selectedSubtitle"
						:options="subtitleOptions"
						:icon="Captions"
						aria-label="Subtitles" />
				</div>
			</div>

			<p
				v-if="item.Overview"
				class="item-detail-overview">
				{{ item.Overview }}
			</p>

			<media-facts :item="item" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import MediaFacts from '@/components/features/item-detail/MediaFacts.vue';
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
