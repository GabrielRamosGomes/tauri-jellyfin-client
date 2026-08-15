<template>
	<div class="settings-view">
		<h1>Settings</h1>

		<div class="settings-row">
			<div>
				<p class="settings-row-label">Appearance</p>
				<p class="settings-row-desc">Choose how the app looks.</p>
			</div>
			<ui-select
				:model-value="preference"
				:options="themeOptions"
				@update:model-value="setPreference($event as ThemePreference)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { ThemePreference } from '@/api/storage/preferences';

	import UiSelect from '@/components/ui/UiSelect.vue';
	import { useTheme } from '@/composables/ui/useTheme';

	const { preference, setPreference } = useTheme();

	const themeOptions: { value: ThemePreference; label: string }[] = [
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
	];
</script>
