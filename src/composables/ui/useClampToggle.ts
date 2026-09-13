import { nextTick, onBeforeUnmount, ref, watch, type WatchSource } from 'vue';

export function useClampToggle(source: WatchSource) {
	const el = ref<HTMLElement>();
	const expanded = ref(false);
	const canToggle = ref(false);

	function measure() {
		const node = el.value;
		if (!node || expanded.value) return; // only meaningful while clamped
		canToggle.value = node.scrollHeight > node.clientHeight + 1;
	}

	function toggle() {
		expanded.value = !expanded.value;
	}

	const resizeObserver = new ResizeObserver(() => measure());

	watch(
		el,
		(node, _prev, onCleanup) => {
			if (!node) return;
			resizeObserver.observe(node);
			onCleanup(() => resizeObserver.unobserve(node));
		},
		{ immediate: true },
	);

	watch(source, () => {
		expanded.value = false;
		nextTick(measure);
	});

	onBeforeUnmount(() => resizeObserver.disconnect());

	return { el, expanded, canToggle, toggle };
}
