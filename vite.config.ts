import path from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},

	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},

	test: {
		environment: 'jsdom',
		include: ['src/**/*.spec.ts'],
		setupFiles: ['./src/test/setup.ts'],
		clearMocks: true,
		restoreMocks: true,
		coverage: {
			provider: 'v8' as const,
			include: ['src/**/*.{ts,vue}'],
			exclude: ['src/test/**', 'src/**/__tests__/**', 'src/**/*.d.ts', 'src/main.ts'],
		},
	},
}));
