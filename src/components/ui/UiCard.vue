<template>
	<div class="ui-card" :class="{ 'ui-card--padded': padded }">
		<slot />
	</div>
</template>

<script setup lang="ts">
	withDefaults(defineProps<{ padded?: boolean }>(), { padded: true });
</script>
