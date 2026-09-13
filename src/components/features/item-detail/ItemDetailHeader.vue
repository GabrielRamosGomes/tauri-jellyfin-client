<template>
	<div class="item-detail-header movie-header">
		<div class="movie-header-content">
			<img
				v-if="logoUrl"
				:src="logoUrl"
				:alt="item.Name ?? ''"
				class="item-detail-logo" />
			<h1
				v-else
				class="item-detail-title">
				{{ item.Name }}
			</h1>

			<div class="item-detail-meta">
				<span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
				<span v-if="runtime">{{ runtime }}</span>
				<ui-badge v-if="item.OfficialRating">{{ item.OfficialRating }}</ui-badge>
				<span
					v-if="communityRating"
					class="item-detail-rating">
					<star
						:size="14"
						fill="currentColor" />
					{{ communityRating }}
				</span>
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
						@click="openExternal(link.Url)">
						{{ link.Name }}
						<external-link
							:size="12"
							aria-hidden="true" />
					</button>
				</div>
			</div>

			<div
				v-if="hasAudio || hasSubtitles"
				class="movie-tracks">
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
				v-if="tagline"
				class="movie-tagline">
				{{ tagline }}
			</p>

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
	import UiBadge from '@/components/ui/UiBadge.vue';
	import UiButton from '@/components/ui/UiButton.vue';
	import UiDropdown from '@/components/ui/UiDropdown.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useMediaStreams } from '@/composables/jellyfin/useMediaStreams';
	import { formatDuration, formatEndsAt, formatRating } from '@/utils/format';
	import { openExternal } from '@/utils/openExternal';
	import { Captions, ExternalLink, Play, Star, Volume2 } from 'lucide-vue-next';
	import { computed, toRef } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	defineEmits<{ play: [] }>();

	const { logoUrl: getLogoUrl } = useMediaImages();
	const { audioOptions, subtitleOptions, selectedAudio, selectedSubtitle, hasAudio, hasSubtitles } =
		useMediaStreams(toRef(props, 'item'));

	const logoUrl = computed(() => getLogoUrl(props.item));
	const communityRating = computed(() => formatRating(props.item.CommunityRating));
	const tagline = computed(() => props.item.Taglines?.[0]);
	const runtime = computed(() => formatDuration(props.item.RunTimeTicks));
	const endsAt = computed(() => formatEndsAt(props.item.RunTimeTicks));
</script>
