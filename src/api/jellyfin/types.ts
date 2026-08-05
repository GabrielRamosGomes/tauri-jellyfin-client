import type { Api } from "@jellyfin/sdk";
import type { PublicSystemInfo } from "@jellyfin/sdk/lib/generated-client/models";

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