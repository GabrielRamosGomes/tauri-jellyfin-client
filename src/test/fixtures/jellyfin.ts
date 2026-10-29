import type { AuthenticatedSession } from '@/api/jellyfin/types';
import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';

export function makeItem(overrides: Partial<BaseItemDto> = {}): BaseItemDto {
	return { Id: 'item-1', Name: 'The Matrix', Type: 'Movie', ImageTags: {}, ...overrides };
}

export function makeMediaStream(overrides: Partial<MediaStream> = {}): MediaStream {
	return { Index: 0, Type: MediaStreamType.Video, IsExternal: false, ...overrides };
}

export function makeSession(overrides: Partial<AuthenticatedSession> = {}): AuthenticatedSession {
	return {
		serverUrl: 'http://jellyfin.local:8096',
		serverId: 'server-1',
		userId: 'user-1',
		username: 'neo',
		accessToken: 'token-1',
		...overrides,
	};
}
