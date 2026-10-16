import {
	TICKS_PER_MINUTE,
	formatDuration,
	formatEndsAt,
	formatRating,
	getInitials,
	ticksToMinutes,
} from '@/utils/format';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const minutes = (count: number) => count * TICKS_PER_MINUTE;

// Expected times go through toLocaleTimeString so the assertions hold in any locale.
const localTime = (date: Date) =>
	date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

describe('ticksToMinutes', () => {
	it.each([undefined, null, 0])('returns undefined for %s', (ticks) => {
		expect(ticksToMinutes(ticks)).toBeUndefined();
	});

	it('converts ticks to whole minutes', () => {
		expect(ticksToMinutes(minutes(42))).toBe(42);
	});

	it('rounds to the nearest minute', () => {
		expect(ticksToMinutes(minutes(1.4))).toBe(1);
		expect(ticksToMinutes(minutes(1.5))).toBe(2);
	});
});

describe('formatDuration', () => {
	it.each([undefined, null, 0])('returns undefined for %s', (ticks) => {
		expect(formatDuration(ticks)).toBeUndefined();
	});

	it('returns undefined when the duration rounds down to zero minutes', () => {
		expect(formatDuration(minutes(0.4))).toBeUndefined();
	});

	it.each([
		[45, '45m'],
		[60, '1h 0m'],
		[90, '1h 30m'],
		[150, '2h 30m'],
	])('formats %i minutes as "%s"', (count, expected) => {
		expect(formatDuration(minutes(count))).toBe(expected);
	});

	it('keeps counting hours for long totals such as a whole season', () => {
		expect(formatDuration(minutes(22 * 42))).toBe('15h 24m');
	});
});

describe('formatEndsAt', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 1, 20, 0));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each([undefined, null, 0])('returns undefined for %s', (ticks) => {
		expect(formatEndsAt(ticks)).toBeUndefined();
	});

	it('returns the local time the item finishes if started now', () => {
		expect(formatEndsAt(minutes(75))).toBe(localTime(new Date(2026, 0, 1, 21, 15)));
	});

	it('wraps past midnight for late-night viewing', () => {
		vi.setSystemTime(new Date(2026, 0, 1, 23, 30));

		expect(formatEndsAt(minutes(90))).toBe(localTime(new Date(2026, 0, 2, 1, 0)));
	});
});

describe('formatRating', () => {
	it.each([undefined, null])('returns undefined for %s', (rating) => {
		expect(formatRating(rating)).toBeUndefined();
	});

	it.each([
		[8, '8.0'],
		[6.84, '6.8'],
	])('formats %d to one decimal as "%s"', (rating, expected) => {
		expect(formatRating(rating)).toBe(expected);
	});

	it('shows a real zero rating instead of treating it as missing', () => {
		expect(formatRating(0)).toBe('0.0');
	});
});

describe('getInitials', () => {
	it.each([undefined, null, ''])('returns "?" for %j', (name) => {
		expect(getInitials(name)).toBe('?');
	});

	it.each([
		['Keanu Reeves', 'KR'],
		['cher', 'C'],
		['Philip Seymour Hoffman', 'PS'],
		['  ada   lovelace ', 'AL'],
		['élodie bouchez', 'ÉB'],
	])('returns the initials of "%s" as "%s"', (name, expected) => {
		expect(getInitials(name)).toBe(expected);
	});
});
