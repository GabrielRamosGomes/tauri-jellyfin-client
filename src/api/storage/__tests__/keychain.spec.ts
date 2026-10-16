import { keychain } from '@/api/storage/keychain';
import { mockKeychain } from '@/test/mocks/tauri-keychain';
import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it, vi } from 'vitest';

describe('keychain', () => {
	// Tauri matches args to the Rust parameter names, so a rename on either side fails only at runtime.
	it.each([
		[
			'set',
			() => keychain.set('http://srv', 'secret'),
			'secure_set',
			{ account: 'http://srv', value: 'secret' },
		],
		['get', () => keychain.get('http://srv'), 'secure_get', { account: 'http://srv' }],
		['delete', () => keychain.delete('http://srv'), 'secure_delete', { account: 'http://srv' }],
	])('%s invokes the matching Rust command with its argument names', async (_, call, cmd, args) => {
		const handler = vi.fn();
		mockIPC(handler);

		await call();

		expect(handler).toHaveBeenCalledExactlyOnceWith(cmd, args);
	});

	it('returns a stored token', async () => {
		mockKeychain();

		await keychain.set('http://srv', 'secret');

		await expect(keychain.get('http://srv')).resolves.toBe('secret');
	});

	it('returns null for an account that was never stored or was deleted', async () => {
		mockKeychain();
		await keychain.set('http://srv', 'secret');

		await keychain.delete('http://srv');

		await expect(keychain.get('http://srv')).resolves.toBeNull();
		await expect(keychain.get('http://other')).resolves.toBeNull();
	});

	it('rejects when the OS keychain fails, instead of reporting a missing token', async () => {
		mockIPC(() => {
			throw new Error('keychain is locked');
		});

		await expect(keychain.get('http://srv')).rejects.toThrow('keychain is locked');
	});
});
