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
						@click="openLink(link.Url)">
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

			<dl class="movie-facts">
				<div
					v-if="item.Genres?.length"
					class="movie-fact">
					<dt>Genres</dt>
					<dd>
						<ui-badge
							v-for="genre in item.Genres"
							:key="genre"
							variant="muted"
							>{{ genre }}</ui-badge
						>
					</dd>
				</div>
				<div
					v-if="directors.length"
					class="movie-fact">
					<dt>{{ directors.length > 1 ? 'Directors' : 'Director' }}</dt>
					<dd>
						<router-link
							v-for="person in directors"
							:key="person.Id"
							:to="{ name: 'person', params: { id: person.Id } }"
							class="movie-fact-link">
							<ui-badge variant="muted">{{ person.Name }}</ui-badge>
						</router-link>
					</dd>
				</div>
				<div
					v-if="writers.length"
					class="movie-fact">
					<dt>{{ writers.length > 1 ? 'Writers' : 'Writer' }}</dt>
					<dd>
						<router-link
							v-for="person in writers"
							:key="person.Id"
							:to="{ name: 'person', params: { id: person.Id } }"
							class="movie-fact-link">
							<ui-badge variant="muted">{{ person.Name }}</ui-badge>
						</router-link>
					</dd>
				</div>
				<div
					v-if="item.Studios?.length"
					class="movie-fact">
					<dt>Studios</dt>
					<dd>
						<ui-badge
							v-for="studio in item.Studios"
							:key="studio.Id ?? studio.Name ?? ''"
							variant="muted"
							>{{ studio.Name }}</ui-badge
						>
					</dd>
				</div>
			</dl>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import ItemActions from '@/components/features/media/ItemActions.vue';
	import UiBadge from '@/components/ui/UiBadge.vue';
	import UiButton from '@/components/ui/UiButton.vue';
	import UiDropdown from '@/components/ui/UiDropdown.vue';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { useMediaStreams } from '@/composables/jellyfin/useMediaStreams';
	import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { Captions, ExternalLink, Play, Star, Volume2 } from 'lucide-vue-next';
	import { computed, toRef } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	defineEmits<{ play: [] }>();

	const { logoUrl: getLogoUrl } = useMediaImages();
	const { audioOptions, subtitleOptions, selectedAudio, selectedSubtitle, hasAudio, hasSubtitles } =
		useMediaStreams(toRef(props, 'item'));

	const logoUrl = computed(() => getLogoUrl(props.item));
	const communityRating = computed(() => props.item.CommunityRating?.toFixed(1));
	const tagline = computed(() => props.item.Taglines?.[0]);

	const runtime = computed(() => {
		if (!props.item.RunTimeTicks) return undefined;

		const minutes = Math.round(props.item.RunTimeTicks / 600_000_000);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours ? `${hours}h ${mins}m` : `${mins}m`;
	});

	const endsAt = computed(() => {
		if (!props.item.RunTimeTicks) return undefined;

		const minutes = props.item.RunTimeTicks / 600_000_000;
		const finishTime = new Date(Date.now() + minutes * 60_000);
		return finishTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	});

	const directors = computed(
		() => props.item.People?.filter((p) => p.Type === PersonKind.Director) ?? [],
	);
	const writers = computed(
		() => props.item.People?.filter((p) => p.Type === PersonKind.Writer) ?? [],
	);

	function openLink(url: string | null | undefined) {
		if (url) openUrl(url);
	}
</script>
