import type { Api } from '@jellyfin/sdk';
import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models';

export interface ClientAppInfo {
	name: string;
	version: string;
	deviceId: string;
	deviceName: string;
}

export interface ConnectedServer {
	serverUrl: string;
	info: PublicSystemInfo;
	api: Api;
}

export interface AuthenticatedSession {
	serverUrl: string;
	serverId: string;
	userId: string;
	username: string;
	accessToken: string;
}

export interface JellyfinUser {
	username: string;
	password: string;
}
