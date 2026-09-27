import type { NameFilter } from '@/api/jellyfin/library';

import { computed, ref } from 'vue';

export const ALL_LETTERS = 'All';
export const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

export function useAlphabetFilter() {
	const letter = ref(ALL_LETTERS);

	// Same mapping jellyfin-web uses: "#" is everything sorting before "A" (digits, symbols).
	const nameFilter = computed<NameFilter>(() => {
		if (letter.value === ALL_LETTERS) return {};
		if (letter.value === '#') return { nameLessThan: 'A' };
		return { nameStartsWith: letter.value };
	});

	return { letter, nameFilter };
}
