import { useResizeObserver, useScroll } from '@vueuse/core';
import { computed, nextTick, ref, watch, type Ref } from 'vue';

// Drives a horizontally scrollable track with prev/next arrow buttons —
// shared by any row of cards (media, cast, ...) that scrolls sideways.
export function useScrollTrack(watchSource: Ref<unknown[]>) {
	const trackRef = ref<HTMLDivElement | null>(null);
	const { arrivedState, measure } = useScroll(trackRef, { offset: { left: 1, right: 1 } });

	const canScrollLeft = computed(() => !arrivedState.left);
	const canScrollRight = computed(() => !arrivedState.right);

	function scroll(direction: 1 | -1) {
		const track = trackRef.value;
		if (!track) return;

		track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
	}

	// arrivedState only updates on scroll events, so re-measure when the track or its content changes.
	useResizeObserver(trackRef, measure);
	watch(watchSource, () => nextTick(measure));

	return { trackRef, canScrollLeft, canScrollRight, scroll };
}
