import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

// Drives a horizontally scrollable track with prev/next arrow buttons —
// shared by any row of cards (media, cast, ...) that scrolls sideways.
export function useScrollTrack(watchSource: Ref<unknown[]>) {
	const trackRef = ref<HTMLDivElement | null>(null);
	const canScrollLeft = ref(false);
	const canScrollRight = ref(false);

	function updateScrollState() {
		const track = trackRef.value;
		if (!track) return;

		canScrollLeft.value = track.scrollLeft > 1;
		canScrollRight.value = track.scrollLeft + track.clientWidth < track.scrollWidth - 1;
	}

	function scroll(direction: 1 | -1) {
		const track = trackRef.value;
		if (!track) return;

		track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
	}

	let resizeObserver: ResizeObserver | undefined;

	onMounted(() => {
		const track = trackRef.value;
		if (!track) return;

		updateScrollState();
		track.addEventListener('scroll', updateScrollState, { passive: true });

		resizeObserver = new ResizeObserver(updateScrollState);
		resizeObserver.observe(track);
	});

	onBeforeUnmount(() => {
		trackRef.value?.removeEventListener('scroll', updateScrollState);
		resizeObserver?.disconnect();
	});

	watch(watchSource, () => nextTick(updateScrollState));

	return { trackRef, canScrollLeft, canScrollRight, scroll };
}
