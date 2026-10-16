import {
	defineComponent,
	effectScope,
	h,
	ref,
	type Component,
	type EffectScope,
	type Ref,
} from 'vue';

// Must stay free of app imports: setup.ts loads it before each spec registers its vi.mock calls.

const scopes = new Set<EffectScope>();

// Runs a composable that uses watch/onScopeDispose/vueuse without mounting a component.
// Scopes left running are stopped after each test by setup.ts.
export function withScope<T>(composable: () => T): [T, EffectScope] {
	const scope = effectScope();
	scopes.add(scope);
	return [scope.run(composable) as T, scope];
}

export function stopScopes() {
	for (const scope of scopes) scope.stop();
	scopes.clear();
}

// Renders `component` with a real two-way `v-model`, the way a parent uses it, so updates flow
// back in as props. Pass `Host` to Testing Library's `render`; read `model` to assert the bound value.
export function withVModel<T>(
	component: Component,
	initial: T,
	props: Record<string, unknown> = {},
) {
	const model = ref(initial) as Ref<T>;
	const Host = defineComponent({
		setup: () => () =>
			h(component, {
				...props,
				modelValue: model.value,
				'onUpdate:modelValue': (value: T) => (model.value = value),
			}),
	});
	return { Host, model };
}

export function deferred<T = void>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}
