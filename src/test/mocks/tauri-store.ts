// Kept on globalThis so the "disk" survives vi.resetModules(), letting a spec simulate an app restart.
const FILES = Symbol.for('fake-tauri-store-files');
const globalFiles = globalThis as { [FILES]?: Map<string, Map<string, unknown>> };
const files = (globalFiles[FILES] ??= new Map());

function fileData(path: string) {
	let data = files.get(path);
	if (!data) {
		data = new Map();
		files.set(path, data);
	}
	return data;
}

// Drop-in for `@tauri-apps/plugin-store`'s LazyStore: `vi.mock('@tauri-apps/plugin-store', () =>
// import('@/test/mocks/tauri-store'))`. Instances on the same path share data like the real file, and
// values are cloned in and out the way JSON persistence would.
export class LazyStore {
	private readonly data: Map<string, unknown>;

	constructor(path: string) {
		this.data = fileData(path);
	}

	async get<T>(key: string): Promise<T | undefined> {
		return structuredClone(this.data.get(key)) as T | undefined;
	}

	async set(key: string, value: unknown) {
		this.data.set(key, structuredClone(value));
	}

	async delete(key: string) {
		return this.data.delete(key);
	}

	async save() {}
}

export function readFakeStore(path: string): Record<string, unknown> {
	return Object.fromEntries(fileData(path));
}

// Clears contents rather than the registry: modules under test hold their LazyStore from import time.
export function resetFakeStores() {
	for (const data of files.values()) data.clear();
}
