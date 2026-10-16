import UiIconButton from '@/components/ui/UiIconButton.vue';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/vue';
import { Heart } from 'lucide-vue-next';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

describe('UiIconButton', () => {
	it('is named by its label, since it has no visible text', async () => {
		const onClick = vi.fn();
		render(UiIconButton, { props: { icon: Heart, label: 'Add to favorites' }, attrs: { onClick } });

		await userEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('cannot be clicked while disabled', async () => {
		const onClick = vi.fn();
		render(UiIconButton, {
			props: { icon: Heart, label: 'Scroll left', disabled: true },
			attrs: { onClick },
		});

		await userEvent.click(screen.getByRole('button', { name: 'Scroll left' }));

		expect(onClick).not.toHaveBeenCalled();
	});

	it('does not submit a surrounding form', async () => {
		const onSubmit = vi.fn((event: Event) => event.preventDefault());
		render({
			render: () => h('form', { onSubmit }, [h(UiIconButton, { icon: Heart, label: 'Like' })]),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Like' }));

		expect(onSubmit).not.toHaveBeenCalled();
	});
});
