import UiProgress from '@/components/ui/UiProgress.vue';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

describe('UiProgress', () => {
	it.each([
		['a fractional played percentage', { value: 37.4532 }, '37'],
		['an almost finished item', { value: 99.6 }, '100'],
		['a value above the maximum', { value: 140 }, '100'],
		['a negative value', { value: -5 }, '0'],
		['a count out of a custom maximum', { value: 3, max: 12 }, '25'],
		['no value', {}, '0'],
	])('reports %s as a whole, clamped percentage', (_, props, expected) => {
		render(UiProgress, { props });

		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', expected);
	});
});
