import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

import { SUBTITLE_OFF, useMediaStreams } from '@/composables/jellyfin/useMediaStreams';
import { makeItem } from '@/test/fixtures/jellyfin';
import { withScope } from '@/test/utils';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

const video = (stream: MediaStream = {}): MediaStream => ({
	Type: MediaStreamType.Video,
	...stream,
});
const audio = (stream: MediaStream): MediaStream => ({ Type: MediaStreamType.Audio, ...stream });
const subtitle = (stream: MediaStream): MediaStream => ({
	Type: MediaStreamType.Subtitle,
	...stream,
});

function streamsOf(MediaStreams: MediaStream[], overrides: Partial<BaseItemDto> = {}) {
	const item = ref(makeItem({ MediaSources: [{ MediaStreams }], ...overrides }));
	const [streams] = withScope(() => useMediaStreams(item));
	return { item, ...streams };
}

describe('useMediaStreams', () => {
	it("reads the streams of the item's first media source", () => {
		const { videoLabel } = streamsOf([video({ DisplayTitle: '1080p HEVC' })], {
			MediaStreams: [video({ DisplayTitle: 'item-level' })],
		});

		expect(videoLabel.value).toBe('1080p HEVC');
	});

	it('falls back to item-level streams when there is no media source', () => {
		const item = ref(makeItem({ MediaStreams: [video({ DisplayTitle: '720p H.264' })] }));
		const [{ videoLabel }] = withScope(() => useMediaStreams(item));

		expect(videoLabel.value).toBe('720p H.264');
	});

	it.each([
		[2160, '4K'],
		[1080, 'HD'],
		[720, 'HD'],
		[576, 'SD'],
		[undefined, undefined],
	])('labels a %s-pixel-tall video as %s', (Height, label) => {
		const { resolutionLabel } = streamsOf([video({ Height })]);

		expect(resolutionLabel.value).toBe(label);
	});

	describe('audio', () => {
		it('labels tracks by display title, else by language and codec', () => {
			const { audioOptions } = streamsOf([
				audio({ Index: 1, DisplayTitle: 'English - Dolby Digital+ - 5.1' }),
				audio({ Index: 2, Language: 'jpn', Codec: 'aac' }),
				audio({ Index: 3, Codec: 'flac' }),
			]);

			expect(audioOptions.value).toEqual([
				{ value: '1', label: 'English - Dolby Digital+ - 5.1' },
				{ value: '2', label: 'jpn · aac' },
				{ value: '3', label: 'flac' },
			]);
		});

		it('selects the default track, else the first one', () => {
			expect(
				streamsOf([audio({ Index: 1 }), audio({ Index: 2, IsDefault: true })]).selectedAudio.value,
			).toBe('2');
			expect(streamsOf([audio({ Index: 1 }), audio({ Index: 2 })]).selectedAudio.value).toBe('1');
		});

		it('can select a track at stream index 0', () => {
			const { selectedAudio } = streamsOf([audio({ Index: 0 })]);

			expect(selectedAudio.value).toBe('0');
		});

		it('reports when the item has no audio', () => {
			const { hasAudio, selectedAudio } = streamsOf([video()]);

			expect(hasAudio.value).toBe(false);
			expect(selectedAudio.value).toBe('');
		});
	});

	describe('subtitles', () => {
		it('offers "No subtitles" before the available tracks', () => {
			const { subtitleOptions } = streamsOf([
				subtitle({ Index: 3, DisplayTitle: 'English - SRT' }),
			]);

			expect(subtitleOptions.value).toEqual([
				{ value: SUBTITLE_OFF, label: 'No subtitles' },
				{ value: '3', label: 'English - SRT' },
			]);
		});

		it('turns on the default subtitle track', () => {
			const { selectedSubtitle } = streamsOf([
				subtitle({ Index: 3 }),
				subtitle({ Index: 4, IsDefault: true }),
			]);

			expect(selectedSubtitle.value).toBe('4');
		});

		it('keeps subtitles off when no track is marked default', () => {
			const { selectedSubtitle, hasSubtitles } = streamsOf([subtitle({ Index: 3 })]);

			expect(hasSubtitles.value).toBe(true);
			expect(selectedSubtitle.value).toBe(SUBTITLE_OFF);
		});
	});

	it("re-selects the new item's defaults when switching to another item", async () => {
		const { item, selectedAudio, selectedSubtitle } = streamsOf([
			audio({ Index: 1, IsDefault: true }),
			subtitle({ Index: 2, IsDefault: true }),
		]);
		selectedAudio.value = '9';

		item.value = makeItem({
			MediaSources: [{ MediaStreams: [audio({ Index: 5 }), subtitle({ Index: 6 })] }],
		});
		await nextTick();

		expect(selectedAudio.value).toBe('5');
		expect(selectedSubtitle.value).toBe(SUBTITLE_OFF);
	});
});
