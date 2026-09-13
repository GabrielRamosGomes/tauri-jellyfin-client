import { onScopeDispose } from 'vue';

interface DebounceOptions {
	flushOnDispose?: boolean;
}

export function useDebounce<A extends unknown[]>(
	fn: (...args: A) => unknown,
	delay: number,
	options: DebounceOptions = {},
) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastArgs: A | undefined;

	function cancel() {
		clearTimeout(timer);
		timer = undefined;
		lastArgs = undefined;
	}

	function flush() {
		if (timer === undefined) return;
		clearTimeout(timer);
		timer = undefined;
		if (lastArgs) fn(...lastArgs);
	}

	function debounced(...args: A) {
		lastArgs = args;
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			fn(...args);
		}, delay);
	}

	onScopeDispose(() => (options.flushOnDispose ? flush() : cancel()));

	return Object.assign(debounced, { cancel, flush });
}
