<template>
	<config-provider :scroll-body="false">
		<router-view />
	</config-provider>
</template>

<script setup lang="ts">
	import { ConfigProvider } from 'reka-ui';
</script>
