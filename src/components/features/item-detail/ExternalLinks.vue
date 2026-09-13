<template>
	<div
		v-if="links?.length"
		class="item-detail-links">
		<ui-button
			v-for="(link, index) in links"
			:key="link.Name ?? index"
			variant="ghost"
			size="sm"
			@click="openExternal(link.Url)">
			{{ link.Name }}
			<external-link
				:size="12"
				aria-hidden="true" />
		</ui-button>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiButton from '@/components/ui/UiButton.vue';
	import { openExternal } from '@/utils/openExternal';
	import { ExternalLink } from 'lucide-vue-next';

	defineProps<{ links: BaseItemDto['ExternalUrls'] }>();
</script>
