import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

import { buildPlayRequest, loadPlayer } from '@/api/player/playback';
import { makeItem, makeMediaStream } from '@/test/fixtures/jellyfin';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';
import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it, vi } from 'vitest';

const api = { basePath: 'http://jellyfin.local:8096', accessToken: 'token-1' } as Api;

const video = makeMediaStream({ Index: 0, Type: MediaStreamType.Video });
const japaneseAudio = makeMediaStream({ Index: 1, Type: MediaStreamType.Audio });
const englishAudio = makeMediaStream({ Index: 2, Type: MediaStreamType.Audio });
const englishSubs = makeMediaStream({ Index: 3, Type: MediaStreamType.Subtitle });
const signsSubs = makeMediaStream({ Index: 4, Type: MediaStreamType.Subtitle });

function playableItem(streams: MediaStream[], overrides: Partial<BaseItemDto> = {}) {
	return makeItem({
		Id: 'item-1',
		Type: 'Episode',
		MediaSources: [{ Id: 'source-1', MediaStreams: streams }],
		...overrides,
	});
}

describe('buildPlayRequest', () => {
	it('builds a direct-play stream URL for the item and its media source', () => {
		const request = buildPlayRequest(api, playableItem([video]), {});

		expect(request.url).toBe(
			'http://jellyfin.local:8096/Videos/item-1/stream?static=true&mediaSourceId=source-1',
		);
	});

	it('keeps the access token out of the URL and passes it separately for the auth header', () => {
		const request = buildPlayRequest(api, playableItem([video]), {});

		expect(request.url).not.toContain('token-1');
		expect(request.token).toBe('token-1');
	});

	it('numbers the selected audio track among audio tracks only, starting at 1', () => {
		const item = playableItem([video, japaneseAudio, englishAudio, englishSubs]);

		const request = buildPlayRequest(api, item, { audioIndex: englishAudio.Index });

		expect(request.audioTrack).toBe(2);
	});

	it('numbers subtitles separately from the video and audio streams before them', () => {
		const item = playableItem([video, japaneseAudio, englishAudio, englishSubs, signsSubs]);

		const request = buildPlayRequest(api, item, { subtitleIndex: signsSubs.Index });

		expect(request.subtitleTrack).toBe(2);
	});

	it('does not count external subtitles, since they are not inside the stream mpv receives', () => {
		const externalSrt = makeMediaStream({
			Index: 2,
			Type: MediaStreamType.Subtitle,
			IsExternal: true,
		});
		const embeddedSubs = makeMediaStream({ Index: 3, Type: MediaStreamType.Subtitle });
		const item = playableItem([video, japaneseAudio, externalSrt, embeddedSubs]);

		const request = buildPlayRequest(api, item, { subtitleIndex: embeddedSubs.Index });

		expect(request.subtitleTrack).toBe(1);
	});

	it('leaves subtitles off when an external subtitle is selected', () => {
		const externalSrt = makeMediaStream({
			Index: 2,
			Type: MediaStreamType.Subtitle,
			IsExternal: true,
		});
		const item = playableItem([video, japaneseAudio, externalSrt]);

		const request = buildPlayRequest(api, item, { subtitleIndex: externalSrt.Index });

		expect(request.subtitleTrack).toBeUndefined();
	});

	it('leaves both tracks unset when nothing is selected, so mpv falls back to its defaults', () => {
		const item = playableItem([video, japaneseAudio, englishSubs]);

		const request = buildPlayRequest(api, item, {});

		expect(request.audioTrack).toBeUndefined();
		expect(request.subtitleTrack).toBeUndefined();
	});

	it('ignores a selected index that no longer exists in the item streams', () => {
		const item = playableItem([video, japaneseAudio, englishSubs]);

		const request = buildPlayRequest(api, item, { audioIndex: 7, subtitleIndex: 8 });

		expect(request.audioTrack).toBeUndefined();
		expect(request.subtitleTrack).toBeUndefined();
	});

	it('resumes from the saved position, converted from ticks to seconds', () => {
		const item = playableItem([video], { UserData: { PlaybackPositionTicks: 6_000_000_000 } });

		const request = buildPlayRequest(api, item, {});

		expect(request.startSeconds).toBe(600);
	});

	it.each([
		['a position of 0', { PlaybackPositionTicks: 0 }],
		['no saved position', {}],
	])('starts from the beginning when the item has %s', (_, userData) => {
		const item = playableItem([video], { UserData: userData });

		const request = buildPlayRequest(api, item, {});

		expect(request.startSeconds).toBeUndefined();
	});

	it('throws for an item without a media source, such as a series', () => {
		const series = makeItem({ Name: 'Attack on Titan', Type: 'Series' });

		expect(() => buildPlayRequest(api, series, {})).toThrow(
			'"Attack on Titan" has no playable media source',
		);
	});
});

describe('loadPlayer', () => {
	// Tauri matches args to the Rust parameter names, so a rename on either side fails only at runtime.
	it('invokes the Rust player_load command with the request under its parameter name', async () => {
		const handler = vi.fn();
		mockIPC(handler);
		const request = { url: 'http://jellyfin.local:8096/Videos/item-1/stream', token: 'token-1' };

		await loadPlayer(request);

		expect(handler).toHaveBeenCalledExactlyOnceWith('player_load', { request });
	});
});
