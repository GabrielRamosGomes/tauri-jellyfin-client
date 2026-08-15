# tauri-jellyfin-client

A Tauri + Vue 3 (Composition API, `<script setup>`) Jellyfin client. State is managed via singleton composables — **no Pinia**. Styling is **plain SCSS** (no Tailwind, no cva, no `cn()` utility) driven by CSS-custom-property design tokens in `src/assets/styles/variables/_variables.scss`.

## Component layers

```
src/components/
  ui/          → small, reusable primitives (buttons, inputs, badges, cards, menus...)
  layout/      → app chrome (header, sidebar, nav, user menu)
  *.vue        → feature components (cards, lists, forms, headers)
```

`ui/` is this project's shadcn-style primitives folder. Today it holds:
`UiButton`, `UiBadge`, `UiCard`, `UiIconButton`, `UiInput`, `UiSelect`.

**Rule: any new visual pattern used in more than one place (buttons, links, inputs, badges, menus, modals, tooltips, dropdowns) belongs in `src/components/ui/`, not copy-pasted inline.** Feature components should compose `Ui*` primitives, not raw `<button>`/`<input>`/`<div>` markup with bespoke classes.

## Reka UI usage

**Prefer a Reka UI primitive over a native form/interactive element whenever one exists for the job** — `Select` instead of `<select>`, `Dialog` instead of `<dialog>`/hand-rolled modals, `Checkbox`/`Switch` instead of `<input type="checkbox">`, `Tooltip`, `Popover`, `Tabs`, `RadioGroup`, `Combobox`, etc. Native elements render OS/browser-controlled chrome (dropdown popups, checkboxes) that can't be styled consistently across platforms and won't match the rest of the app — that's exactly why `UiSelect.vue` wraps Reka UI's `Select*` instead of `<select>` (see below). Reach for a plain native element only when there's no interactive/stateful behavior to it (e.g. `<input type="text">`/`<input type="url">` inside `UiInput`, which just needs a value and focus styling, not a Reka UI primitive).

```vue
<script setup lang="ts">
	import {
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuPortal,
		DropdownMenuRoot,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from 'reka-ui';
</script>

<template>
	<dropdown-menu-root>
		<dropdown-menu-trigger class="ui-avatar app-header-avatar">...</dropdown-menu-trigger>
		<dropdown-menu-portal>
			<dropdown-menu-content class="dropdown-menu-content" :side-offset="8" align="end">
				<dropdown-menu-item class="dropdown-menu-item" @select="signOut">...</dropdown-menu-item>
				<dropdown-menu-separator class="dropdown-menu-separator" />
			</dropdown-menu-content>
		</dropdown-menu-portal>
	</dropdown-menu-root>
</template>
```

Conventions established by this file (follow them for any new Reka UI usage):

- Reka UI primitives are unstyled — visuals come entirely from global SCSS classes in `src/assets/styles/ui-kit/` (e.g. `.dropdown-menu-content`/`.dropdown-menu-item` in `_dropdown-menu.scss`), keyed off Reka UI's state data-attributes (e.g. `[data-highlighted]`) rather than component props.
- Import the primitives directly from `reka-ui` and reference them in templates by their kebab-case tag name (Vue auto-converts `DropdownMenuRoot` → `<dropdown-menu-root>`). No `cva`, no `cn()`, no forwardProps wrapper — this project does not use those shadcn-vue conventions.
- `<dropdown-menu-portal>` is required to render content outside the normal DOM flow (it's teleported); don't skip it.

### When to wrap a Reka UI primitive in `ui/`

`UserMenu.vue` inlines Reka UI's `DropdownMenu*` directly rather than going through a `Ui*` wrapper — acceptable since it's a single one-off usage with no second consumer. `UiSelect.vue` is the example of the other case: it wraps Reka UI's `Select*` primitives (`SelectRoot`, `SelectTrigger`, `SelectValue`, `SelectPortal`, `SelectContent`, `SelectViewport`, `SelectItem`, `SelectItemText`, `SelectItemIndicator`) because a native `<select>`'s dropdown popup can't be styled consistently across platforms — Reka UI renders the listbox as regular (teleported) DOM instead, so it takes the same `.ui-select-*` treatment as everything else in `src/assets/styles/ui-kit/`. **As soon as a second consumer needs a primitive currently inlined somewhere** (e.g. a second dropdown, a dialog, a popover, a tooltip), extract it into `src/components/ui/` the same way: accept the minimal prop surface the feature needs, add a `_component-name.scss` partial to `ui-kit/` (forwarded from `ui-kit/_index.scss`) styled via classes keyed on Reka's `data-*` attributes, keep the Reka UI import inside the wrapper only.

## Layers: api → composable → view/component

```
src/api/           → plain TS, no Vue. Talks to the Jellyfin SDK and Tauri plugins.
src/composables/   → reactive state + actions. Bridges api ↔ UI. Singleton by default, but scope state locally in the composable when it doesn't need to be shared.
src/views/         → route-level components (one per router entry). Own the page's data flow.
src/components/    → presentational; receive data via props, emit events. No api/ imports.
```

- **`src/api/`** — framework-agnostic TypeScript, no `vue` imports. `jellyfin.ts` wraps the `@jellyfin/sdk` client; `storage/auth.ts` wraps Tauri's `LazyStore`/keychain plugins. Plain arguments in, plain data/promises out.
- **`src/composables/`** — the only layer allowed to import both `vue` and `src/api/*`. Module-scope `ref`s (singleton) by convention when state is app-wide (`useAuthSession`, `useServerConnection`, `useServers`); declare the `ref` inside the `use*()` body instead when it's only needed by one call site. Owns `loading`/`errorMessage` and exposes actions that call into `src/api/*`.
- **`src/views/`** — one per route, calls composables directly, wires their state/actions to feature components, owns page-level control flow.
- **`src/components/`** (including `ui/`) — presentational: props in, events out, no `src/api/` imports. `layout/*` (`UserMenu.vue`, `AppSidebar.vue`) is the sanctioned exception, reading singletons directly since it's mounted once outside any view.

**Rule: `src/api/` code must never import Vue or touch the DOM/UI.** If you need reactivity around an API call, add it in a composable, not in `src/api/`.

## Router

`src/router/index.ts` defines routes in two groups:

- `/login` (`name: 'login'`) — `meta: { requiresAuth: false }`, standalone (not nested under the app shell).
- Everything else is nested under `/` → `src/layouts/AppShell.vue` (`meta: { requiresAuth: true }` on the parent, inherited by children `home`, `dashboard`, `metadata-manager`, `settings`, `library/:id`, `item/:id`).

A single `router.beforeEach` guard handles session restoration for protected routes:

```ts
router.beforeEach(async (to) => {
	if (to.meta.requiresAuth === false) return; // /login skips the guard entirely

	const { api, connect } = useServerConnection();
	const { session, restoreActive, logout } = useAuthSession();

	if (api.value && session.value) return; // already connected this app run

	const saved = await restoreActive(); // try to restore from storage
	if (!saved) return { name: 'login', query: { redirect: to.fullPath } };

	const server = await connect(saved.serverUrl);
	if (!server) {
		await logout();
		return { name: 'login', query: { redirect: to.fullPath } };
	}
	server.api.accessToken = saved.accessToken;
});
```

It runs once per app launch: the guard calls straight into the `useAuthSession`/`useServerConnection` singleton composables (not `src/api/` directly), and once `api`/`session` are populated, later navigations short-circuit on the `if (api.value && session.value) return;` line. Views and layout components then read the same singletons reactively — there's no separate "auth store" to keep in sync.

`LoginView.vue` layers its own logic on top via `route.query`: `?redirect=` (set by the guard) is used after a successful login; `?mode=signout` (set by `UserMenu.vue`'s sign-out handler) is read via `isSignOutMode` to decide whether to show the server list or jump straight to the credentials form. See the note in the "resolved inconsistencies" section above — this `route.query.mode` gating currently has an open bug where it can end up in the wrong state after "Change Server" from the account menu; needs investigation before relying on it further.

## Styling conventions

### Styles folder structure

```
src/assets/styles/
  main.scss        → the only file directly in this folder; @uses each subfolder's _index.scss
  variables/        → _variables.scss (design tokens), forwarded by _index.scss
  base/             → _global.scss (:root reset, generic element styles), forwarded by _index.scss
  layout/           → app-chrome partials (_app-shell.scss today), forwarded by _index.scss
  ui-kit/           → one partial per Ui* primitive (_button.scss, _input.scss, _select.scss, ...), forwarded by _index.scss
  features/         → one partial per feature component/view (_server-form.scss, _library-card.scss, _settings.scss, ...), forwarded by _index.scss
```

Every subfolder has an `_index.scss` that `@forward`s its partials, so `main.scss` only ever does `@use './base'; @use './layout'; @use './features'; @use './ui-kit';` — never reach into a subfolder's individual partial from `main.scss` or from another subfolder. Any partial that needs design tokens does `@use '../variables' as v;` (through the folder's `_index.scss`, not a direct `../variables/variables` path) and references them as `v.$space-md`, `v.$radius-lg`, etc.

**When adding a new `Ui*` primitive**: add `ui-kit/_<name>.scss` and add a `@forward './<name>';` line to `ui-kit/_index.scss`. Same pattern for a new feature component's styles under `features/`.

- Design tokens (colors, in light/dark) are CSS custom properties in `src/assets/styles/variables/_variables.scss` (`--color-text`, `--color-bg`, `--color-surface`, `--color-border`, `--color-primary`, ...). Dark mode is a `dark-tokens` mixin applied via `prefers-color-scheme` or `[data-theme='dark']` (see `src/composables/ui/useTheme.ts`).
- Spacing/radius/font-size/shadow/transition scales are SCSS variables (`$space-*`, `$radius-*`, `$font-size-*`, `$shadow-*`, `$transition-fast`), not CSS custom properties — use the existing scale, don't hardcode `px` values in new components.
- Component variants (`UiButton`'s `variant`/`size`) are plain template-literal class bindings (`` `ui-btn--${variant}` ``) against BEM-style classes in `ui-kit/_button.scss`, not `class-variance-authority`. Keep new primitives consistent with this — don't introduce `cva` for a single component.
- No Tailwind. Do not suggest Tailwind utility classes or a `cn()` helper; neither exists in this project.

## General

- No Pinia — state lives in singleton composables (see `src/composables/`).
