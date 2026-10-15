import { useSiblingNav } from '@/composables/ui/useSiblingNav';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

const episodes = [{ Id: 'e1' }, { Id: 'e2' }, { Id: 'e3' }];

function navFrom(currentId: string | undefined, items = episodes) {
	return useSiblingNav(ref(items), ref(currentId));
}

describe('useSiblingNav', () => {
	it('links to both neighbours from the middle', () => {
		const { prev, next } = navFrom('e2');

		expect(prev.value?.Id).toBe('e1');
		expect(next.value?.Id).toBe('e3');
	});

	it('has no previous on the first item', () => {
		const { prev, next } = navFrom('e1');

		expect(prev.value).toBeUndefined();
		expect(next.value?.Id).toBe('e2');
	});

	it('has no next on the last item', () => {
		const { prev, next } = navFrom('e3');

		expect(prev.value?.Id).toBe('e2');
		expect(next.value).toBeUndefined();
	});

	it('links nowhere when the current item is not in the list', () => {
		const { prev, next } = navFrom('unknown');

		expect(prev.value).toBeUndefined();
		expect(next.value).toBeUndefined();
	});

	it('reports no siblings for a single-item list', () => {
		expect(navFrom('e1', [{ Id: 'e1' }]).hasSiblings.value).toBe(false);
		expect(navFrom('e1').hasSiblings.value).toBe(true);
	});

	it('updates once the sibling list finishes loading', () => {
		const items = ref<{ Id: string }[]>([]);
		const { next } = useSiblingNav(items, ref('e1'));
		expect(next.value).toBeUndefined();

		items.value = episodes;

		expect(next.value?.Id).toBe('e2');
	});
});
