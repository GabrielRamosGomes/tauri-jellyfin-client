import { authStorage } from '@/api/storage/auth';
import { Api, Jellyfin } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';

import { version } from '../../../package.json';
import { AuthenticatedSession, ClientAppInfo, ConnectedServer, JellyfinUser } from './types';

const CLIENT_NAME = 'Jellyfin Tauri';
const CLIENT_VERSION = version;
const DEVICE_NAME = 'Desktop';

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await authStorage.getDeviceId();
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await authStorage.setDeviceId(deviceId);
  }
  return deviceId;
}

async function getDefaultClientAppInfo(): Promise<ClientAppInfo> {
  return {
    name: CLIENT_NAME,
    version: CLIENT_VERSION,
    deviceId: await getOrCreateDeviceId(),
    deviceName: DEVICE_NAME,
  };
}

function createApiClient(sdk: Jellyfin, serverUrl: string): Api {
  return sdk.createApi(serverUrl);
}

async function validateServerUrl(sdk: Jellyfin, url: string): Promise<string> {
  const candidates = await sdk.discovery.getRecommendedServerCandidates(url);
  const best = sdk.discovery.findBestServer(candidates);

  if (!best) {
    throw new Error('No valid Jellyfin server found at the provided URL.');
  }

  return best.address;
}

export async function createClient(info?: ClientAppInfo): Promise<Jellyfin> {
  const appInfo = info ?? (await getDefaultClientAppInfo());

  return new Jellyfin({
    clientInfo: {
      name: appInfo.name,
      version: appInfo.version,
    },
    deviceInfo: {
      name: appInfo.deviceName,
      id: appInfo.deviceId,
    },
  });
}

export async function connectToServer(sdk: Jellyfin, serverUrl: string): Promise<ConnectedServer> {
  const validUrl = await validateServerUrl(sdk, serverUrl);
  const api = createApiClient(sdk, validUrl);
  const systemApi = getSystemApi(api);

  const response = await systemApi.getPublicSystemInfo();

  return {
    serverUrl: validUrl,
    info: response.data,
    api: api,
  };
}

export async function authenticateUser(
  api: Api,
  user: JellyfinUser,
): Promise<AuthenticatedSession> {
  const userApi = getUserApi(api);
  const { data } = await userApi.authenticateUserByName({
    authenticateUserByName: {
      Username: user.username,
      Pw: user.password,
    },
  });

  if (!data.AccessToken || !data.User?.Id) {
    throw new Error('Authentication succeeded but no access token was returned.');
  }

  // calls on this 'api' will be autenthicated
  api.accessToken = data.AccessToken;

  return {
    serverUrl: api.basePath,
    serverId: data.ServerId ?? '',
    userId: data.User.Id,
    username: data.User.Name ?? user.username,
    accessToken: data.AccessToken,
  };
}
