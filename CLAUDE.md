# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Tauri 2 + Vue 3 + TypeScript desktop client for Jellyfin. The Rust side (`src-tauri/`) is intentionally minimal — default Tauri scaffolding plus three custom commands (`secure_set`/`secure_get`/`secure_delete` in `src-tauri/src/lib.rs`) that wrap the `keyring` crate for OS-native credential storage. All real application logic lives in the Vue/TypeScript frontend. `libmpv` is a declared Rust dependency reserved for future native video playback (not wired up yet).

Roadmap and current progress live in `TODO.md` — check it before starting new feature work instead of assuming scope; it's the source of truth for what's done vs. planned, not this file.

## Commands

- `pnpm dev` — Vite dev server only. **Tauri IPC is unavailable this way** (no `window.__TAURI_INTERNALS__`), so anything touching `src/api/storage/*` (session persistence, keychain) will throw. Fine for pure UI/styling iteration.
- `pnpm tauri dev` — full Tauri app; the only way to exercise auth, session persistence, or the keychain commands.
- `pnpm build` — `vue-tsc --noEmit && vite build`. Run this (or just `vue-tsc --noEmit`) to type-check.
- `pnpm lint` / `pnpm lint:fix` — oxlint (config in `oxlint.config.ts`).
- `pnpm format` / `pnpm format:check` — oxfmt (config in `oxfmt.config.ts`; tabs, single quotes, import-sorted by group).
- No test runner is set up in this repo yet (no Vitest/Playwright configured) — don't assume test commands exist.

## Architecture

### State layer: singleton composables, not Pinia

**Rule: a composable always owns and contains its state internally.** Its `ref()`s are declared in the composable's own file/function — never accepted as external parameters, never imported from some other state-holding module, never assembled by the caller. The caller only ever gets state _out_ of a composable via its return value, never injects state _into_ one. This is what makes a composable a self-contained unit rather than a bag of functions operating on someone else's refs.

Within that rule, there are two valid scopes for where the state lives, and the choice is deliberate per composable:

- **Singleton** (`useServerConnection`, `useAuthSession`, `useServers`, `useLibraries`): state is declared at **module scope**, outside the exported `use*()` function, so every call returns the _same_ refs. This is why: there is exactly one live server connection, one active session, one servers list, one library list for the whole app, and many unrelated components need to observe and mutate that _same_ state simultaneously (the login view, the sidebar, the router guard). A per-call factory would give each of them an independent copy that immediately desyncs. This was a deliberate choice over Pinia — don't introduce Pinia, and don't refactor these four into per-call factories; both have been explicitly discussed and declined.

- **Instance** (`useLibraryItems`): state is declared **inside the function body**, so every call gets fresh, independent refs — appropriate here because each library grid genuinely needs its own item list, not a shared one. It takes a `Ref<string>` (the library id) as a _parameter_ to react to, which isn't a violation of the ownership rule above — the id is an input the composable watches, not state it's handing off ownership of. It `watch()`es that ref internally to refetch, which also solves the Vue Router gotcha where navigating between `/library/A` and `/library/B` reuses the same component instance, so `onMounted` alone won't refire.

When adding a new composable, decide singleton vs. instance the same way: does this state represent one app-wide truth, or something that legitimately varies per usage site? Either way, the state it exposes must be defined inside it.

### Data flow: `api/jellyfin` → `composables` → `views`/`components`

- `src/api/jellyfin/jellyfin.ts` — Jellyfin SDK client creation, server discovery/validation, and `authenticateUser`. The SDK's `Api` class builds the `Authorization` header itself from `clientInfo`/`deviceInfo`/`accessToken` on every request — there's no manual header-building code, and none should be added.
- `src/api/jellyfin/library.ts` — library views and item fetches, plus `getLibraryImageUrl` (builds image URLs via the SDK's `ImageUrlsApi`; despite the name it's generic over any `BaseItemDto`, not library-specific).
- `src/api/jellyfin/types.ts` — app-level types are built on top of the SDK's own generated types (`BaseItemDto`, `PublicSystemInfo`, etc.) rather than re-declared. Only add a new type here if the SDK doesn't already provide the shape.
- `src/api/storage/auth.ts` + `keychain.ts` — session storage is deliberately split: non-sensitive metadata (server URL, user id, username) goes through `@tauri-apps/plugin-store` (`settings.json`), keyed by `serverUrl`; the access token goes through the OS keychain (`keychain.ts` → Rust `secure_*` commands) and is never written to plugin-store. `authStorage.getSession()` recombines both halves. Keep this split when touching session persistence — don't let a token end up back in plain JSON.

### Routing

`src/router/index.ts` is two-tier: `/login` is unguarded (server connect + auth UI, also reused while already logged in for "Select Server" — it resets local state on mount so it always starts in "pick a server" mode). Everything else is nested under the `AppShell` layout (`src/layouts/AppShell.vue` + `src/components/layout/AppSidebar.vue`) behind a `requiresAuth` route meta.

The `router.beforeEach` guard is the _only_ place that restores a saved session and reconnects on app launch — it runs once per launch (subsequent navigations see `api.value && session.value` already set and skip straight through, since the composables are singletons). Views assume `api`/`session` are already populated by the time they render rather than checking auth themselves.

### Styling: SCSS, no `<style>` blocks in `.vue` files

`src/assets/styles/` has one partial per component/concern (`_app.scss`, `_layout.scss`, `_server-form.scss`, `_library-card.scss`, etc.), each `@use`-ing `_variables.scss` for color tokens. All partials are aggregated into `main.scss`, which is imported once, globally, in `main.ts`. This is an explicit project rule — new components get a new SCSS partial `@use`d into `main.scss`, not an in-component `<style>` block. Dark mode is handled per-partial with its own `@media (prefers-color-scheme: dark)` block (colocated with the light rules for that component), not one central dark-theme file — `_variables.scss` defines both light and dark tokens as separate SCSS variables (not CSS custom properties).

### Vue conventions

Composition API with `<script setup lang="ts">` throughout; component tags used in templates are kebab-case (`<server-list>`, not `<ServerList>`). Cross-component object `v-model` (e.g. `credentials` in `LoginForm`) relies on the child mutating the shared object in place rather than always emitting `update:modelValue` — intentional, not a bug, given the object reference is shared rather than cloned.
