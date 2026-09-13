import { computed, type Ref } from 'vue';

interface HasId {
	Id?: string | null;
}

export function useSiblingNav<T extends HasId>(
	items: Ref<T[]>,
	currentId: Ref<string | undefined>,
) {
	const index = computed(() => items.value.findIndex((item) => item.Id === currentId.value));

	const prev = computed(() => (index.value > 0 ? items.value[index.value - 1] : undefined));
	const next = computed(() =>
		index.value >= 0 && index.value < items.value.length - 1
			? items.value[index.value + 1]
			: undefined,
	);
	const hasSiblings = computed(() => items.value.length > 1);

	return { prev, next, hasSiblings };
}
