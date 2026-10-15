import { openExternal } from '@/utils/openExternal';
import { openUrl } from '@tauri-apps/plugin-opener';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }));

describe('openExternal', () => {
	it('opens the URL in the system browser', () => {
		openExternal('https://www.imdb.com/title/tt0133093');

		expect(openUrl).toHaveBeenCalledExactlyOnceWith('https://www.imdb.com/title/tt0133093');
	});

	it.each([undefined, null, ''])('does nothing for a missing URL (%j)', (url) => {
		openExternal(url);

		expect(openUrl).not.toHaveBeenCalled();
	});
});
