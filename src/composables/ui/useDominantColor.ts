import { fetch } from '@tauri-apps/plugin-http';
import { Vibrant } from 'node-vibrant/browser';
import { ref } from 'vue';

async function sampleDominantColor(imageUrl: string): Promise<string | undefined> {
	let blobUrl: string | undefined;

	try {
		const response = await fetch(imageUrl);
		if (!response.ok) return undefined;

		blobUrl = URL.createObjectURL(await response.blob());

		const img = new Image();
		img.src = blobUrl;
		await img.decode();

		const palette = await Vibrant.from(img).getPalette();

		const swatch = palette.DarkMuted ?? palette.DarkVibrant ?? palette.Muted ?? palette.Vibrant;

		return swatch?.hex;
	} catch {
		return undefined;
	} finally {
		if (blobUrl) URL.revokeObjectURL(blobUrl);
	}
}

const CACHE_LIMIT = 64;
const cache = new Map<string, string | undefined>();
const inFlight = new Map<string, Promise<string | undefined>>();

function extractDominantColor(imageUrl: string): Promise<string | undefined> {
	if (cache.has(imageUrl)) return Promise.resolve(cache.get(imageUrl));

	const pending = inFlight.get(imageUrl);
	if (pending) return pending;

	const job = sampleDominantColor(imageUrl).then((result) => {
		inFlight.delete(imageUrl);

		if (cache.size >= CACHE_LIMIT) {
			const oldest = cache.keys().next().value;
			if (oldest !== undefined) cache.delete(oldest);
		}

		cache.set(imageUrl, result);
		return result;
	});

	inFlight.set(imageUrl, job);
	return job;
}

export function useDominantColor() {
	const color = ref<string | undefined>();
	let requestId = 0;

	async function setFromImage(imageUrl: string | undefined) {
		const currentRequest = ++requestId;

		if (!imageUrl) {
			color.value = undefined;
			return;
		}

		const result = await extractDominantColor(imageUrl);
		if (currentRequest === requestId) color.value = result;
	}

	function clear() {
		requestId += 1;
		color.value = undefined;
	}

	return { color, setFromImage, clear };
}
