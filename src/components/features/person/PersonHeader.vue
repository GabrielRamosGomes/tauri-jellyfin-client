<template>
	<div class="person-header">
		<div class="person-photo">
			<img v-if="photoUrl" :src="photoUrl" :alt="person.Name ?? ''" />
			<span v-else>{{ initials }}</span>
		</div>

		<div class="person-main">
			<div class="person-name-row">
				<h1 class="person-name">{{ person.Name }}</h1>

				<ui-icon-button
					:icon="Heart"
					:label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
					:disabled="pending"
					class="person-fav"
					:class="{ 'person-fav--active': isFavorite }"
					@click="toggleFavorite"
				/>
			</div>

			<p v-if="birthLine" class="person-subtitle">{{ birthLine }}</p>

			<template v-if="person.Overview">
				<p ref="bioEl" class="person-bio" :class="{ 'person-bio--clamped': !expanded }">
					{{ person.Overview }}
				</p>
				<ui-button
					v-if="canToggle"
					variant="ghost"
					size="sm"
					class="person-bio-toggle"
					@click="expanded = !expanded"
				>
					{{ expanded ? 'Read less' : 'Read more' }}
				</ui-button>
			</template>

			<div v-if="person.ExternalUrls?.length" class="person-links">
				<ui-button
					v-for="(link, index) in person.ExternalUrls"
					:key="link.Name ?? index"
					variant="secondary"
					size="sm"
					class="person-link"
					@click="openLink(link.Url)"
				>
					{{ link.Name }}
					<external-link :size="12" aria-hidden="true" />
				</ui-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

	import UiButton from '@/components/ui/UiButton.vue';
	import UiIconButton from '@/components/ui/UiIconButton.vue';
	import { useItemActions } from '@/composables/jellyfin/useItemActions';
	import { useMediaImages } from '@/composables/jellyfin/useMediaImages';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { ExternalLink, Heart } from 'lucide-vue-next';
	import { computed, ref, toRef } from 'vue';

	const MAX_CHARS_BEFORE_COLLAPSE = 300;
	const props = defineProps<{ person: BaseItemDto }>();
	const { libraryImageUrl } = useMediaImages();

	const personRef = toRef(props, 'person');
	const { pending, toggleFavorite } = useItemActions(personRef);

	const expanded = ref(false);
	const isLong = computed(() => (props.person.Overview?.length ?? 0) > MAX_CHARS_BEFORE_COLLAPSE);

	const isFavorite = computed(() => props.person.UserData?.IsFavorite ?? false);
	const photoUrl = computed(() => libraryImageUrl(props.person));

	const initials = computed(() =>
		(props.person.Name ?? '?')
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join(''),
	);

	const birthDate = computed(() => {
		if (!props.person.PremiereDate) return undefined;

		// No locale arg → respects the OS locale/format (e.g. 27/12/1976).
		return new Date(props.person.PremiereDate).toLocaleDateString();
	});

	const birthPlace = computed(() => props.person.ProductionLocations?.[0]);

	// Compact "Born <date> · <place>" subtitle; either part may be missing.
	const birthLine = computed(() =>
		[birthDate.value && `Born ${birthDate.value}`, birthPlace.value].filter(Boolean).join(' · '),
	);

	function openLink(url: string | null | undefined) {
		if (url) openUrl(url);
	}
</script>
