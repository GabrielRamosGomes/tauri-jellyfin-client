# tauri-jellyfin-client

A Tauri + Vue 3 (Composition API, `<script setup>`) Jellyfin client. State is managed via singleton composables — **no Pinia**. Styling is **plain SCSS** (no Tailwind, no cva, no `cn()` utility) driven by CSS-custom-property design tokens in `src/assets/styles/variables/_variables.scss`.

## Component layers

```
src/components/
  ui/          → small, reusable primitives (buttons, inputs, badges, cards, menus...)
  layout/      → app chrome (header, sidebar, nav, user menu)
  features/    → feature components (cards, lists, forms, headers) — one per screen/section, not generic
```

`ui/` is this project's primitives folder. See `src/components/ui/` for the current set (buttons, badges, cards, icon buttons, inputs, selects, dropdowns, progress bars, skeletons, spinners, scrollable rows, aspect-ratio wrappers).

**Rule: any new visual pattern used in more than one place (buttons, links, inputs, badges, menus, modals, tooltips, dropdowns) belongs in `src/components/ui/`, not copy-pasted inline.** Feature components should compose `Ui*` primitives, not raw `<button>`/`<input>`/`<div>` markup with bespoke classes.

## Reka UI usage

**Prefer a Reka UI primitive over a native form/interactive element whenever one exists for the job** — `Select` instead of `<select>`, `Dialog` instead of `<dialog>`/hand-rolled modals, `Checkbox`/`Switch` instead of `<input type="checkbox">`, `Tooltip`, `Popover`, `Tabs`, `RadioGroup`, `Combobox`, etc. Native elements render OS/browser-controlled chrome that can't be styled consistently across platforms and won't match the rest of the app — that's why `UiSelect.vue`/`UiDropdown.vue` wrap Reka's `Select*` instead of `<select>`. Reach for a plain native element only when there's no interactive/stateful behavior to it (e.g. `<input type="text">`/`<input type="url">` inside `UiInput`, which just needs a value and focus styling).

Conventions for any new Reka UI usage (see `UserMenu.vue` for a worked example):

- Reka UI primitives are unstyled — visuals come entirely from global SCSS classes in `src/assets/styles/ui-kit/` (e.g. `.dropdown-menu-content`/`.dropdown-menu-item` in `_dropdown-menu.scss`), keyed off Reka's state data-attributes (`[data-highlighted]`, etc.) rather than component props.
- Import the primitives directly from `reka-ui` and reference them by their kebab-case tag name (Vue auto-converts `DropdownMenuRoot` → `<dropdown-menu-root>`). No forwardProps wrapper.
- The `*Portal` primitive (`<dropdown-menu-portal>`, `<select-portal>`) is required to render teleported content outside normal DOM flow; don't skip it.

### When to wrap a Reka UI primitive in `ui/`

`UserMenu.vue` inlines Reka's `DropdownMenu*` directly rather than through a `Ui*` wrapper — acceptable as a single one-off with no second consumer. `UiSelect.vue`/`UiDropdown.vue` are the other case: they wrap Reka's `Select*` primitives so the listbox renders as regular (teleported) DOM and takes the same `.ui-*` treatment as everything else in `ui-kit/`. (Both currently wrap `Select*` — `UiSelect` is the plain select; `UiDropdown` adds an icon/description-per-option layout. Prefer extending one over adding a third Select wrapper.)

**As soon as a second consumer needs a primitive currently inlined somewhere** (a second dropdown, a dialog, a popover, a tooltip), extract it into `src/components/ui/`: accept the minimal prop surface the feature needs, add a `_component-name.scss` partial to `ui-kit/` (forwarded from `ui-kit/_index.scss`) styled via classes keyed on Reka's `data-*` attributes, and keep the Reka UI import inside the wrapper only.

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
- Everything else is nested under `/` → `src/layouts/AppShell.vue` (`meta: { requiresAuth: true }` on the parent, inherited by all children): `home`, `settings`, `library/:id`, `item/:id`, `person/:id`, plus `dashboard` and `metadata-manager` (both placeholders rendering `ComingSoonView`). See `src/router/index.ts` for the live list.

A single `router.beforeEach` guard handles session restoration for protected routes (see `src/router/index.ts` for the code). It short-circuits on `/login`, and otherwise: if `api`/`session` are already set it returns immediately; otherwise it tries `restoreActive()` from storage, redirects to `login` with a `?redirect=` query when there's nothing to restore, reconnects the saved server, and reapplies the saved access token.

It runs once per app launch: the guard calls straight into the `useAuthSession`/`useServerConnection` singleton composables (not `src/api/` directly), and once `api`/`session` are populated, later navigations short-circuit. Views and layout components then read the same singletons reactively — there's no separate "auth store" to keep in sync.

`LoginView.vue` layers its own logic on top via `route.query`: `?redirect=` (set by the guard) is used after a successful login; `?mode=signout` (set by `UserMenu.vue`'s sign-out handler) decides whether to show the server list or jump straight to the credentials form.

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
- Component variants (`UiButton`'s `variant`/`size`) are plain template-literal class bindings (`` `ui-btn--${variant}` ``) against BEM-style classes in `ui-kit/_button.scss`. Keep new primitives consistent — no `cva` for a single component (and no Tailwind/`cn()`; see the intro).

## Comments

Keep comments sparse. The code should read for itself; a comment earns its place only by explaining **why** something non-obvious is done (a gotcha, a workaround, a deliberate trade-off). Do not:

- Restate what the code already says (`// loading ref`, `// returns the items`).
- Add per-field doc comments to prop/option interfaces or narrate each step of a function.
- Write JSDoc blocks or section-divider banners on small internal helpers/composables.

A single short line on a genuinely surprising decision is good; a comment on every declaration is noise. Prefer a clear name over a comment. When in doubt, leave it out.
