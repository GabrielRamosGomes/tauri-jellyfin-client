// oxlint-disable-next-line import/no-unassigned-import -- registers jest-dom matchers and their types
import '@testing-library/jest-dom/vitest';
import { clearMocks as clearTauriMocks } from '@tauri-apps/api/mocks';
import { cleanup } from '@testing-library/vue';
import { afterEach, vi } from 'vitest';

import { stopScopes } from './utils';

afterEach(() => {
	// Testing Library only auto-cleans when vitest globals are on, and we keep them off.
	cleanup();
	stopScopes();
	clearTauriMocks();
	vi.useRealTimers();
});

// jsdom gaps that Reka UI's popper/select primitives rely on.
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
