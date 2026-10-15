import { effectScope, type EffectScope } from 'vue';

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

export function deferred<T = void>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}
