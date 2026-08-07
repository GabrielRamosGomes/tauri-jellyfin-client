import { Jellyfin } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

import { version } from '../../../package.json';
import { authStorage } from '../storage/auth';
import { ClientAppInfo, ConnectedServer } from './types';

const CLIENT_NAME = 'Jellyfin Tauri';
const CLIENT_VERSION = version;
const DEVICE_NAME = 'Desktop';

async function getOrCreateDeviceId() {
  let deviceId = await authStorage.getDeviceId();
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await authStorage.setDeviceId(deviceId);
  }
  return deviceId;
}

async function getDefaultClientAppInfo() {
  return {
    name: CLIENT_NAME,
    version: CLIENT_VERSION,
    deviceId: await getOrCreateDeviceId(),
    deviceName: DEVICE_NAME,
  };
}

function createApiClient(sdk: Jellyfin, serverUrl: string) {
  return sdk.createApi(serverUrl);
}

async function validateServerUrl(sdk: Jellyfin, url: string) {
  const candidates = await sdk.discovery.getRecommendedServerCandidates(url);
  const best = sdk.discovery.findBestServer(candidates);

  if (!best) {
    throw new Error('No valid Jellyfin server found at the provided URL.');
  }

  return best.address;
}

export async function createClient(info?: ClientAppInfo) {
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

export async function connectToServer(sdk: Jellyfin, serverUrl: string) {
  const validUrl = await validateServerUrl(sdk, serverUrl);
  const api = createApiClient(sdk, validUrl);
  const systemApi = getSystemApi(api);

  const response = await systemApi.getPublicSystemInfo();

  return {
    serverUrl: validUrl,
    info: response.data,
    api: api,
  } satisfies ConnectedServer;
}
