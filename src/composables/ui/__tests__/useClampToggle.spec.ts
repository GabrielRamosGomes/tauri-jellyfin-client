import { useClampToggle } from '@/composables/ui/useClampToggle';
import { withScope } from '@/test/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

// jsdom has no layout: the text block's heights are faked, and resizes are fired by hand.
let resizeCallbacks: (() => void)[];
const resize = () => resizeCallbacks.forEach((callback) => callback());

function textBlock(size: { scrollHeight: number; clientHeight: number }) {
	const el = document.createElement('p');
	Object.defineProperty(el, 'scrollHeight', { get: () => size.scrollHeight });
	Object.defineProperty(el, 'clientHeight', { get: () => size.clientHeight });
	return el;
}

async function clamp(size: { scrollHeight: number; clientHeight: number }) {
	const overview = ref('A long overview');
	const [toggle] = withScope(() => useClampToggle(overview));
	toggle.el.value = textBlock(size);
	await nextTick();
	resize();
	return { ...toggle, overview, size };
}

beforeEach(() => {
	resizeCallbacks = [];
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				resizeCallbacks.push(callback);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('useClampToggle', () => {
	it('offers "show more" when the text overflows its clamp', async () => {
		const { canToggle } = await clamp({ scrollHeight: 120, clientHeight: 60 });

		expect(canToggle.value).toBe(true);
	});

	it('offers nothing when the text fits, allowing for 1px of sub-pixel rounding', async () => {
		const { canToggle } = await clamp({ scrollHeight: 61, clientHeight: 60 });

		expect(canToggle.value).toBe(false);
	});

	it('keeps "show less" available while expanded, even though nothing overflows any more', async () => {
		const { canToggle, toggle, expanded, size } = await clamp({
			scrollHeight: 120,
			clientHeight: 60,
		});

		toggle();
		size.clientHeight = 120;
		resize();

		expect(expanded.value).toBe(true);
		expect(canToggle.value).toBe(true);
	});

	it('collapses and re-measures when the text changes, e.g. on another item', async () => {
		const { canToggle, toggle, expanded, overview, size } = await clamp({
			scrollHeight: 120,
			clientHeight: 60,
		});
		toggle();

		size.scrollHeight = 40;
		size.clientHeight = 40;
		overview.value = 'A short overview';
		await nextTick();
		await nextTick();

		expect(expanded.value).toBe(false);
		expect(canToggle.value).toBe(false);
	});
});
