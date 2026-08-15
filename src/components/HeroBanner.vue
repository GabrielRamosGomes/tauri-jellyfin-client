<template>
	<section class="hero-banner" :style="backdropStyle">
		<div class="hero-banner-overlay">
			<div class="hero-banner-content">
				<p v-if="isEpisode" class="hero-banner-eyebrow">{{ episodeLabel }}</p>
				<h1 class="hero-banner-title">{{ title }}</h1>

				<div class="hero-banner-meta">
					<span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
					<span v-if="item.OfficialRating">{{ item.OfficialRating }}</span>
					<span v-if="runtimeMinutes">{{ runtimeMinutes }} min</span>
				</div>

				<p v-if="item.Overview" class="hero-banner-overview">{{ item.Overview }}</p>

				<router-link :to="{ name: 'item', params: { id: item.Id } }" custom v-slot="{ navigate }">
					<ui-button @click="navigate">
						<play :size="18" fill="currentColor" />
						{{ progress ? 'Resume' : 'Play' }}
					</ui-button>
				</router-link>

				<div v-if="progress" class="hero-banner-progress">
					<div class="hero-banner-progress-bar" :style="{ width: `${progress}%` }" />
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import { getBackdropUrl } from '@/api/jellyfin/library';
	import UiButton from '@/components/ui/UiButton.vue';
	import { useServerConnection } from '@/composables/jellyfin/useServerConnection';
	import { Play } from 'lucide-vue-next';
	import { computed } from 'vue';

	const props = defineProps<{ item: BaseItemDto }>();
	const { api } = useServerConnection();

	const backdropUrl = computed(() =>
		api.value ? getBackdropUrl(api.value, props.item) : undefined,
	);
	const backdropStyle = computed(() =>
		backdropUrl.value ? { backgroundImage: `url(${backdropUrl.value})` } : {},
	);

	const isEpisode = computed(() => props.item.Type === 'Episode');

	const title = computed(() =>
		isEpisode.value ? (props.item.SeriesName ?? props.item.Name) : props.item.Name,
	);

	const episodeLabel = computed(() => {
		const season = props.item.ParentIndexNumber;
		const episode = props.item.IndexNumber;
		const label = season != null && episode != null ? `S${season}:E${episode}` : '';

		return [label, props.item.Name].filter(Boolean).join(' · ');
	});

	const runtimeMinutes = computed(() =>
		props.item.RunTimeTicks ? Math.round(props.item.RunTimeTicks / 600_000_000) : undefined,
	);

	const progress = computed(() => props.item.UserData?.PlayedPercentage);
</script>
