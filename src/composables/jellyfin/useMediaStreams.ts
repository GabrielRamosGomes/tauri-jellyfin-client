import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';
import { computed, ref, watch, type Ref } from 'vue';

interface TrackOption {
	value: string;
	label: string;
}

export const SUBTITLE_OFF = 'off';

function streamLabel(stream: MediaStream) {
	return stream.DisplayTitle ?? [stream.Language, stream.Codec].filter(Boolean).join(' · ') ?? '';
}

export function useMediaStreams(item: Ref<BaseItemDto>) {
	const streams = computed<MediaStream[]>(
		() => item.value.MediaSources?.[0]?.MediaStreams ?? item.value.MediaStreams ?? [],
	);

	const video = computed(() => streams.value.find((s) => s.Type === MediaStreamType.Video));
	const audioStreams = computed(() =>
		streams.value.filter((s) => s.Type === MediaStreamType.Audio),
	);
	const subtitleStreams = computed(() =>
		streams.value.filter((s) => s.Type === MediaStreamType.Subtitle),
	);

	const videoLabel = computed(() => video.value?.DisplayTitle ?? undefined);

	const resolutionLabel = computed(() => {
		const height = video.value?.Height;
		if (!height) return undefined;
		if (height >= 2160) return '4K';
		if (height >= 720) return 'HD';
		return 'SD';
	});

	const videoRange = computed(() => video.value?.VideoRange || undefined);

	const audioOptions = computed<TrackOption[]>(() =>
		audioStreams.value.map((s) => ({ value: String(s.Index), label: streamLabel(s) })),
	);

	const subtitleOptions = computed<TrackOption[]>(() => [
		{ value: SUBTITLE_OFF, label: 'No subtitles' },
		...subtitleStreams.value.map((s) => ({ value: String(s.Index), label: streamLabel(s) })),
	]);

	const selectedAudio = ref('');
	const selectedSubtitle = ref(SUBTITLE_OFF);

	watch(
		audioStreams,
		(list) => {
			const preferred = list.find((s) => s.IsDefault) ?? list[0];
			selectedAudio.value = preferred?.Index != null ? String(preferred.Index) : '';
		},
		{ immediate: true },
	);

	watch(
		subtitleStreams,
		(list) => {
			const preferred = list.find((s) => s.IsDefault);
			selectedSubtitle.value = preferred?.Index != null ? String(preferred.Index) : SUBTITLE_OFF;
		},
		{ immediate: true },
	);

	return {
		videoLabel,
		resolutionLabel,
		videoRange,
		audioOptions,
		subtitleOptions,
		selectedAudio,
		selectedSubtitle,
		hasAudio: computed(() => audioStreams.value.length > 0),
		hasSubtitles: computed(() => subtitleStreams.value.length > 0),
	};
}
