import { useDominantColor } from '@/composables/ui/useDominantColor';
import { deferred } from '@/test/utils';
import { fetch } from '@tauri-apps/plugin-http';
import { Vibrant } from 'node-vibrant/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-http', () => ({ fetch: vi.fn() }));
vi.mock('node-vibrant/browser', () => ({ Vibrant: { from: vi.fn() } }));

type Palette = Partial<Record<'DarkMuted' | 'DarkVibrant' | 'Muted' | 'Vibrant', { hex: string }>>;

const imageResponse = { ok: true, blob: async () => new Blob() } as Response;

// The color cache lives for the whole app session, so every test samples its own URLs.
let testId = 0;
let image: (name: string) => string;

function paletteIs(palette: Palette) {
	vi.mocked(Vibrant.from).mockReturnValue({
		getPalette: vi.fn().mockResolvedValue(palette),
	} as never);
}

beforeEach(() => {
	testId += 1;
	image = (name) => `http://jellyfin.local/Items/${testId}-${name}/Images/Backdrop`;
	URL.createObjectURL = vi.fn(() => `blob:${testId}`);
	URL.revokeObjectURL = vi.fn();
	HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
	vi.mocked(fetch).mockResolvedValue(imageResponse);
	paletteIs({ DarkMuted: { hex: '#1a1d2b' } });
});

describe('useDominantColor', () => {
	it.each<[string, Palette, string | undefined]>([
		['dark muted', { DarkMuted: { hex: '#111' }, DarkVibrant: { hex: '#222' } }, '#111'],
		['dark vibrant', { DarkVibrant: { hex: '#222' }, Muted: { hex: '#333' } }, '#222'],
		['muted', { Muted: { hex: '#333' }, Vibrant: { hex: '#444' } }, '#333'],
		['vibrant', { Vibrant: { hex: '#444' } }, '#444'],
		['nothing', {}, undefined],
	])('picks the %s swatch as the best available backdrop tint', async (_, palette, expected) => {
		paletteIs(palette);
		const { color, setFromImage } = useDominantColor();

		await setFromImage(image('poster'));

		expect(color.value).toBe(expected);
	});

	it('gives no color when the image request fails', async () => {
		vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
		const { color, setFromImage } = useDominantColor();

		await setFromImage(image('missing'));

		expect(color.value).toBeUndefined();
		expect(Vibrant.from).not.toHaveBeenCalled();
	});

	it('gives no color when the image cannot be decoded, and still frees its blob URL', async () => {
		HTMLImageElement.prototype.decode = vi.fn().mockRejectedValue(new Error('bad image'));
		const { color, setFromImage } = useDominantColor();

		await setFromImage(image('corrupt'));

		expect(color.value).toBeUndefined();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith(`blob:${testId}`);
	});

	it('samples each image once, however many views ask for it', async () => {
		const header = useDominantColor();
		const card = useDominantColor();

		await Promise.all([header.setFromImage(image('a')), card.setFromImage(image('a'))]);
		await useDominantColor().setFromImage(image('a'));

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(header.color.value).toBe('#1a1d2b');
		expect(card.color.value).toBe('#1a1d2b');
	});

	it('keeps the latest image’s color when an earlier one finishes last', async () => {
		const slow = deferred<Response>();
		vi.mocked(fetch).mockImplementation(async (url) =>
			String(url) === image('slow') ? slow.promise : imageResponse,
		);
		const { color, setFromImage } = useDominantColor();

		const first = setFromImage(image('slow'));
		paletteIs({ DarkMuted: { hex: '#latest' } });
		await setFromImage(image('fast'));
		paletteIs({ DarkMuted: { hex: '#stale' } });
		slow.resolve(imageResponse);
		await first;

		expect(color.value).toBe('#latest');
	});

	it.each([
		['clear()', (dominant: ReturnType<typeof useDominantColor>) => dominant.clear()],
		[
			'an empty image',
			(dominant: ReturnType<typeof useDominantColor>) => dominant.setFromImage(undefined),
		],
	])('%s resets the color and discards a sample still in flight', async (_, reset) => {
		const slow = deferred<Response>();
		vi.mocked(fetch).mockReturnValue(slow.promise);
		const dominant = useDominantColor();
		dominant.color.value = '#previous';

		const pending = dominant.setFromImage(image('slow'));
		await reset(dominant);
		slow.resolve(imageResponse);
		await pending;

		expect(dominant.color.value).toBeUndefined();
	});
});
