import { useDebounce } from '@/composables/ui/useDebounce';
import { withScope } from '@/test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
	vi.useFakeTimers();
});

function debounce(options?: { flushOnDispose?: boolean }) {
	const fn = vi.fn();
	const [debounced, scope] = withScope(() => useDebounce(fn, 300, options));
	return { fn, debounced, scope };
}

describe('useDebounce', () => {
	it('runs once with the latest arguments after calls stop for the delay', () => {
		const { fn, debounced } = debounce();

		debounced('m');
		debounced('ma');
		debounced('mat');
		vi.advanceTimersByTime(299);
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledExactlyOnceWith('mat');
	});

	it('restarts the delay on every call', () => {
		const { fn, debounced } = debounce();

		debounced('a');
		vi.advanceTimersByTime(200);
		debounced('b');
		vi.advanceTimersByTime(200);

		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledExactlyOnceWith('b');
	});

	it('cancel() drops the pending call', () => {
		const { fn, debounced } = debounce();

		debounced('a');
		debounced.cancel();
		vi.advanceTimersByTime(300);

		expect(fn).not.toHaveBeenCalled();
	});

	it('flush() runs the pending call right away, and only once', () => {
		const { fn, debounced } = debounce();

		debounced('a');
		debounced.flush();
		vi.advanceTimersByTime(300);

		expect(fn).toHaveBeenCalledExactlyOnceWith('a');
	});

	it('flush() does nothing when no call is pending', () => {
		const { fn, debounced } = debounce();

		debounced('a');
		vi.advanceTimersByTime(300);
		debounced.flush();

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('drops the pending call when its owner is unmounted', () => {
		const { fn, debounced, scope } = debounce();

		debounced('a');
		scope.stop();
		vi.advanceTimersByTime(300);

		expect(fn).not.toHaveBeenCalled();
	});

	it('runs the pending call on unmount when asked to flush on dispose', () => {
		const { fn, debounced, scope } = debounce({ flushOnDispose: true });

		debounced('a');
		scope.stop();

		expect(fn).toHaveBeenCalledExactlyOnceWith('a');
	});
});
