import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';
import { invoke } from '@tauri-apps/api/core';

const TICKS_PER_SECOND = 10_000_000;

// Should always be equal to the rust struct
export interface PlayRequest {
	url: string;
	token: string;
	audioTrack?: number;
	subtitleTrack?: number;
	startSeconds?: number;
}

export interface TrackSelection {
	audioIndex?: number;
	subtitleIndex?: number;
}

function toMpvTrackId(streams: MediaStream[], index: number | undefined, type: MediaStreamType) {
	if (index === undefined) return undefined;

	const embedded = streams.filter((s) => s.Type === type && !s.IsExternal);
	if (!embedded.some((s) => s.Index === index)) return undefined;

	return embedded.filter((s) => (s.Index ?? 0) < index).length + 1;
}

export function buildPlayRequest(
	api: Api,
	item: BaseItemDto,
	selection: TrackSelection,
): PlayRequest {
	const source = item.MediaSources?.[0];
	if (!item.Id || !source?.Id) {
		throw new Error(`"${item.Name ?? 'This item'}" has no playable media source`);
	}

	const streams = source.MediaStreams ?? [];
	const params = new URLSearchParams({ static: 'true', mediaSourceId: source.Id });
	const ticks = item.UserData?.PlaybackPositionTicks;

	return {
		url: `${api.basePath}/Videos/${item.Id}/stream?${params}`,
		token: api.accessToken,
		audioTrack: toMpvTrackId(streams, selection.audioIndex, MediaStreamType.Audio),
		subtitleTrack: toMpvTrackId(streams, selection.subtitleIndex, MediaStreamType.Subtitle),
		startSeconds: ticks ? ticks / TICKS_PER_SECOND : undefined,
	};
}

export async function loadPlayer(request: PlayRequest) {
	await invoke('player_load', { request });
}
