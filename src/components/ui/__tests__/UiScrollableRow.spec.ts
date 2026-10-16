import UiScrollableRow from '@/components/ui/UiScrollableRow.vue';
import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

describe('UiScrollableRow', () => {
	it('shows the row under its heading when it has items', () => {
		render(UiScrollableRow, {
			props: { title: 'Continue Watching', items: [{}, {}] },
			slots: { default: '<article>The Matrix</article>' },
		});

		expect(screen.getByRole('heading', { name: 'Continue Watching' })).toBeInTheDocument();
		expect(screen.getByText('The Matrix')).toBeInTheDocument();
	});

	it('renders nothing at all for an empty row, so the home page has no blank sections', () => {
		render(UiScrollableRow, {
			props: { title: 'Continue Watching', items: [] },
			slots: { default: '<article>leftover</article>' },
		});

		expect(screen.queryByRole('heading', { name: 'Continue Watching' })).not.toBeInTheDocument();
		expect(screen.queryByText('leftover')).not.toBeInTheDocument();
	});
});
