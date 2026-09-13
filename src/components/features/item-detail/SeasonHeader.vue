<template>
	<div class="item-detail-header season-header">
		<div class="item-detail-header-overlay">
			<div class="item-detail-poster">
				<ui-aspect-ratio :ratio="2 / 3">
					<img
						v-if="posterUrl"
						:src="posterUrl"
						:alt="item.Name ?? ''" />
				</ui-aspect-ratio>
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
						:is="prevSeason ? 'router-link' : 'span'"
						v-if="hasMultipleSeasons"
						class="season-nav"
						:class="{ 'season-nav--disabled': !prevSeason }"
						:to="prevSeason ? { name: 'item', params: { id: prevSeason.Id } } : undefined"
						:aria-label="prevSeason ? `Go to ${prevSeason.Name}` : undefined">
						<chevron-left :size="20" />
					</component>

					<h1 class="item-detail-title">{{ item.Name }}</h1>

					<component
						:is="nextSeason ? 'router-link' : 'span'"
						v-if="hasMultipleSeasons"
						class="season-nav"
						:class="{ 'season-nav--disabled': !nextSeason }"
						:to="nextSeason ? { name: 'item', params: { id: nextSeason.Id } } : undefined"
						:aria-label="nextSeason ? `Go to ${nextSeason.Name}` : undefined">
						<chevron-right :size="20" />
					</component>
				</div>

				<div class="item-detail-meta">
					<span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
					<span v-if="episodeCount">{{ episodeCount }} episodes</span>
					<span v-if="totalRuntime">{{ totalRuntime }}</span>
					<span
						v-if="communityRating"
						class="item-detail-rating">
						<star
							:size="14"
							fill="currentColor" />
						{{ communityRating }}
					</span>
				</div>

				<div
					v-if="episodeCount"
					class="season-progress">
					<ui-progress
						:value="watchedPercent"
						class="season-progress-track" />
					<span class="season-progress-label">{{ watchedCount }} / {{ episodeCount }} watched</span>
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
						@click="playResume">
						<play
							:size="18"
							fill="currentColor" />
						{{ playLabel }}
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
	import UiButton from '@/components/ui/UiButton.vue';
	import UiProgress from '@/components/ui/UiProgress.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useSeasons } from '@/composables/jellyfin/useSeasons';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { ChevronLeft, ChevronRight, ExternalLink, Play, Star } from 'lucide-vue-next';
	import { computed } from 'vue';
	import { useRouter } from 'vue-router';

	const props = defineProps<{ item: BaseItemDto; episodes: BaseItemDto[] }>();
	const router = useRouter();
	const { libraryImageUrl } = useMediaImages();

	const posterUrl = computed(() => libraryImageUrl(props.item));
	const communityRating = computed(() => props.item.CommunityRating?.toFixed(1));

	// --- Season switcher ---
	const seriesId = computed(() => props.item.SeriesId ?? '');
	const { seasons } = useSeasons(seriesId);

	const hasMultipleSeasons = computed(() => seasons.value.length > 1);
	const currentIndex = computed(() => seasons.value.findIndex((s) => s.Id === props.item.Id));
	const prevSeason = computed(() =>
		currentIndex.value > 0 ? seasons.value[currentIndex.value - 1] : undefined,
	);
	const nextSeason = computed(() =>
		currentIndex.value >= 0 && currentIndex.value < seasons.value.length - 1
			? seasons.value[currentIndex.value + 1]
			: undefined,
	);

	// --- Aggregate meta from the episode list ---
	const episodeCount = computed(() => props.episodes.length);
	const watchedCount = computed(() => props.episodes.filter((e) => e.UserData?.Played).length);
	const watchedPercent = computed(() =>
		episodeCount.value ? Math.round((watchedCount.value / episodeCount.value) * 100) : 0,
	);

	const totalRuntime = computed(() => {
		const ticks = props.episodes.reduce((sum, e) => sum + (e.RunTimeTicks ?? 0), 0);
		if (!ticks) return undefined;

		const minutes = Math.round(ticks / 600_000_000);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours ? `${hours}h ${mins}m` : `${mins}m`;
	});

	// --- Resume / play ---
	// Prefer a partially-watched episode, else the first unwatched, else the start.
	const resumeEpisode = computed(() => {
		const inProgress = props.episodes.find(
			(e) => (e.UserData?.PlaybackPositionTicks ?? 0) > 0 && !e.UserData?.Played,
		);
		const firstUnwatched = props.episodes.find((e) => !e.UserData?.Played);
		return inProgress ?? firstUnwatched ?? props.episodes[0];
	});

	const playLabel = computed(() => {
		const ep = resumeEpisode.value;
		if (!ep || watchedCount.value === 0 || ep.Id === props.episodes[0]?.Id) return 'Play';

		return `Resume S${ep.ParentIndexNumber ?? props.item.IndexNumber}:E${ep.IndexNumber}`;
	});

	function playResume() {
		const target = resumeEpisode.value;
		if (target?.Id) router.push({ name: 'item', params: { id: target.Id } });
	}

	function openLink(url: string | null | undefined) {
		if (url) openUrl(url);
	}
</script>
