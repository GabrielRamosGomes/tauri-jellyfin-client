<template>
	<div class="nav-group">
		<p v-if="label" class="nav-section-label">{{ label }}</p>
		<p v-if="!items.length && emptyText" class="nav-empty">{{ emptyText }}</p>

		<template v-for="item in items" :key="item.label">
			<router-link v-if="!item.exact" :to="item.to" class="nav-item">
				<component :is="item.icon" :size="20" />
				<span>{{ item.label }}</span>
			</router-link>

			<router-link v-else :to="item.to" custom v-slot="{ isExactActive, navigate, href }">
				<a
					:href="href"
					class="nav-item"
					:class="{ 'router-link-active': isExactActive }"
					@click="navigate"
				>
					<component :is="item.icon" :size="20" />
					<span>{{ item.label }}</span>
				</a>
			</router-link>
		</template>
	</div>
</template>

<script setup lang="ts">
	import type { Component } from 'vue';
	import type { RouteLocationRaw } from 'vue-router';

	export interface NavItem {
		to: RouteLocationRaw;
		label: string;
		icon: Component;
		// Use exact route matching for the active state (needed for links to
		// "/" — see the router-link "always active" note in AppSidebar).
		exact?: boolean;
	}

	defineProps<{
		items: NavItem[];
		label?: string;
		emptyText?: string;
	}>();
</script>
