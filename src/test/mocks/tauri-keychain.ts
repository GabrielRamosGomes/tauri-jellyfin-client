import { mockIPC } from '@tauri-apps/api/mocks';

// In-memory stand-in for the Rust `secure_*` commands in src-tauri/src/lib.rs, including their
// "missing entry is not an error" semantics. Returns the backing map so tests can inspect or tamper.
export function mockKeychain() {
	const entries = new Map<string, string>();

	mockIPC((cmd, args) => {
		const { account, value } = args as { account: string; value?: string };

		switch (cmd) {
			case 'secure_set':
				entries.set(account, value as string);
				return;
			case 'secure_get':
				return entries.get(account) ?? null;
			case 'secure_delete':
				entries.delete(account);
				return;
			default:
				throw new Error(`Unexpected IPC command: ${cmd}`);
		}
	});

	return entries;
}
