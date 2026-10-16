# Testing guidelines

How tests are written in this project. Read this before adding or changing any test. It builds on the
architecture rules in `CLAUDE.md` (api → composable → view/component, singleton composables, Reka UI
primitives), so read that first.

## Principle: behavior, not coverage

Coverage percentage is not a goal and is never a reason to add a test. Every test must protect a
behavior someone would notice breaking, or an edge case that can actually happen in this app.

- Before writing cases, check how the unit is **actually used** (grep its call sites) and derive edge
  cases from real data: Jellyfin fields that come back `null`, a `0` rating vs. a missing one, season
  runtime totals, names with accents or extra spaces, a server that's offline, an expired token, a
  library with exactly one page.
- Don't test the language or a library (`toFixed` rounding, Vue reactivity, Reka internals, the SDK).
  Test what _our_ code decides.
- Don't add a case that fails for the same reason as an existing one. One case per distinct behavior.
- If writing a test exposes a real bug, stop and report it. Don't encode the buggy behavior in an
  assertion, and don't silently fix production code inside a testing task.

## Workflow

Tests are added **one layer at a time** (see Priorities), and the session stops after each layer so the
user can review and commit before the next one starts. Don't run ahead into the next layer.

## Stack

| Tool                          | Role                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `vitest`                      | Runner. Configured in `vite.config.ts` (`test` block).      |
| `jsdom`                       | DOM environment. Chosen over happy-dom for Reka UI support. |
| `@testing-library/vue`        | Rendering + user-centric queries for components.            |
| `@testing-library/user-event` | Realistic interactions (typing, clicking, keyboard).        |
| `@testing-library/jest-dom`   | DOM matchers (`toBeInTheDocument`, `toBeDisabled`, ...).    |
| `@vue/test-utils`             | Only for `flushPromises` and rare low-level cases.          |
| `@tauri-apps/api/mocks`       | `mockIPC` for code that calls `invoke` directly.            |

- `globals: false`. Import `describe`/`it`/`expect`/`vi` from `vitest` explicitly in every file.
- Config sets `clearMocks: true` and `restoreMocks: true`. Still configure mock return values inside
  each test or `beforeEach`, never in a `vi.mock` factory, so one test's setup can't leak into the next.
- Package manager is **pnpm**: `pnpm test:run` (watch), `pnpm vitest run` (once), `pnpm test:cov`
  (coverage report), `pnpm vitest run path/to/file.spec.ts` for one file.

## File layout

Tests are **co-located** in a `__tests__/` folder next to the code they cover, one spec per source file:

```
src/
  utils/
    format.ts
    __tests__/format.spec.ts
  api/storage/
    auth.ts
    __tests__/auth.spec.ts
  composables/jellyfin/
    useAuthSession.ts
    __tests__/useAuthSession.spec.ts
  components/ui/
    UiSelect.vue
    __tests__/UiSelect.spec.ts
  test/                    → shared test infrastructure only, never specs
    setup.ts               → jest-dom matchers; after each test: cleanup, stop scopes, clear Tauri
                             mocks, real timers; jsdom polyfills. Must never import app modules.
    utils.ts               → withScope(), deferred(). App-free, because setup.ts imports it
    session.ts             → signIn() / signOut(): seed or clear the connection + session singletons
    router.ts              → createTestRouter() / renderAt(component, path, options): memory router
                             mirroring src/router/index.ts (names, paths, login's requiresAuth meta)
    fixtures/jellyfin.ts   → data factories (makeItem, makeSession, ...)
    mocks/tauri-store.ts   → in-memory LazyStore (+ readFakeStore, resetFakeStores)
    mocks/tauri-keychain.ts → mockKeychain(): in-memory stand-in for the Rust secure_* commands
```

- Name specs `<SourceFileName>.spec.ts`, matching the source file's name exactly.
- Import the unit under test with the `@/` alias (`@/composables/jellyfin/useAuthSession`), not `../`.
- When you move or rename a source file, move its `__tests__/` spec with it.
- Anything reused by two or more spec files goes in `src/test/`. Don't copy helpers between specs.
- E2E (real Tauri window) is out of scope for now. If added later it gets a root-level `e2e/` folder.

## What to test, by layer

Mock at the layer boundary below the one you're testing. Everything above that boundary stays real.

### `src/utils/`: pure functions

Plain input → output tests. No mocks. Use `vi.useFakeTimers()` + `vi.setSystemTime()` for anything
reading `Date.now()` (e.g. `formatEndsAt`). Cover edge cases: `null`/`undefined`/`0`, rounding, boundaries.

### `src/api/`: framework-agnostic adapters

- **Jellyfin (`api/jellyfin/*`)**: mock the SDK's `get*Api` factories, not HTTP. Pass `{} as Api`.
  ```ts
  vi.mock('@jellyfin/sdk/lib/utils/api/items-api', () => ({ getItemsApi: vi.fn() }));

  vi.mocked(getItemsApi).mockReturnValue({
  	getItems: vi.fn().mockResolvedValue({ data: { Items: [item], TotalRecordCount: 1 } }),
  } as never);
  ```
  Assert the **request params** sent to the SDK and the **shape returned** (`?? []` defaults, totals,
  filtering such as `getLatestMedia` dropping episodes, branching such as `getLandscapeImageUrl`).
  Don't write tests for one-line pass-throughs that hold no logic.
- **Storage (`api/storage/*`)**: anything reaching `invoke` (the keychain) → `mockKeychain()` from
  `src/test/mocks/tauri-keychain.ts`, or raw `mockIPC` to assert the command contract. Tauri's
  `clearMocks()` already runs after every test from `setup.ts`. `@tauri-apps/plugin-store` →
  `vi.mock('@tauri-apps/plugin-store', () => import('@/test/mocks/tauri-store'))` and call
  `resetFakeStores()` in `beforeEach`. Assert observable behavior through the
  module's own API (save then get round-trips, clear removes, active server is unset, ...), not which
  store keys were written.

### `src/composables/`: the core of the suite

- **Never mock another composable.** For the api layer:
  - `@/api/jellyfin/*` → automock it (`vi.mock('@/api/jellyfin/library')`, no factory) and set
    return values per test with `vi.mocked(getLibraryItems).mockResolvedValue(...)`.
  - `@/api/storage/*` → don't mock it. Mock the Tauri boundary under it (store fake + `mockKeychain()`),
    so persistence is exercised for real ("after logout, `restoreActive()` returns null").
- Composables that read `useServerConnection`/`useAuthSession` get real instances: `signIn()` in
  `beforeEach` (after `signOut()` to clear the previous test), `signOut()` to test signed-out guards.
- **Singleton state persists across tests in the same file.** Reset it in `beforeEach` through the
  composable's public actions (`clearData()`, `reset()`, writing the returned refs). For hidden module
  state with no public reset (`useTheme`'s init flag), `vi.resetModules()` + `await import(...)` a fresh
  copy. The fake store survives that reload like a file on disk, so it doubles as an app restart. For a
  hidden cache (`useDominantColor`), give every test its own keys instead.
- **Choose the harness by what the composable uses:**
  - only `ref`/`computed`/plain functions → call it directly.
  - `watch`/`watchEffect`/`onScopeDispose`/vueuse (`useJellyfinResource`, `useDebounce`,
    `useServerStatus`) → `const [result, scope] = withScope(() => useX(...))`. Scopes are stopped after
    each test automatically. Call `scope.stop()` yourself to test unmount behavior.
  - `onMounted`/`onUnmounted`/`inject`/`useRoute` → mount it in a host component and unmount in
    `afterEach`. (No composable needs this yet. Add a `withSetup` helper to `src/test/utils.ts` when one does.)
- **Async control**: use `deferred()` to hold a request open and assert in-between states (loading,
  "checking", stale responses), and `flushPromises()` after a watcher-triggered load. With fake timers,
  `vi.advanceTimersByTimeAsync()` also flushes the promises the timer callback starts.
- **Races are first-class edge cases**: for anything that fetches on a changing source (route id,
  filters, image URL), test what happens when an older response arrives after a newer one.
- **Layout-dependent composables** (`useClampToggle`): fake `scrollHeight`/`clientHeight` with
  `Object.defineProperty`, and `vi.stubGlobal('ResizeObserver', ...)` with a class that captures the
  callback so the test can fire resizes. `vi.unstubAllGlobals()` in `afterEach`.
- Test the state contract every async composable here exposes: `loading` toggles around the call,
  `errorMessage` is set from the thrown `Error` (and the fallback string for non-`Error` throws), data
  is replaced or appended correctly (pagination in `useLibraryItems`), and guards short-circuit when
  `api`/`session` are missing. Silence the expected `console.error` with
  `vi.spyOn(console, 'error').mockImplementation(() => {})` in tests that exercise failure paths.

### `src/components/`: presentational, props in / events out

- Pure props-in/events-out components need no module mocks. Components that call a data composable
  themselves (`ItemActions` → `useItemActions`) are set up like a composable spec: automock the
  `@/api/jellyfin/*` module and `signIn()`. Components that fetch through several composables and use
  the router (`EpisodeHeader`, `SeasonHeader`, `PersonHeader`, `SeriesContent`, `HeroBanner`) belong
  to the views/integration layer. (`layout/*` is also tested like a view.)
- Render with `@testing-library/vue`'s `render`, interact with `userEvent`, and assert on what the
  user sees, on the bound model, and on handler props (`onSubmit: vi.fn()` passed as a prop).
- Event handlers are passed as props or `attrs` (`render(UiButton, { attrs: { onClick } })`).
- `v-model` components: use `withVModel(Component, initial, props)` from `src/test/utils.ts`. It gives a
  real two-way binding (`model.value`), like a parent. For several models (`v-model:open` +
  `v-model:url`), write a small `defineComponent` host with `h()` and one `ref` per model.
- Behaviors that depend on a parent (a button inside a `<form>`, an action inside a clickable card)
  are tested by rendering that parent with `h()`: "does not submit the form", "does not open the card".
- Render children for real. No `shallowMount` and no stubbing `Ui*` children: they're part of the
  behavior being tested. Stub only things jsdom can't do (e.g. `node-vibrant`).
- **Reka UI / teleport**: `*Portal` content is teleported to `document.body`. Testing Library's
  `screen` already queries `document.body`, so `screen.getByRole('option', ...)` finds it. Open
  menus/selects the way a user does (`await user.click(screen.getByRole('combobox'))`). Never import
  Reka primitives into tests or assert on their internals. The polyfills Reka needs in jsdom
  (`ResizeObserver`, `scrollIntoView`, pointer-capture methods) live in `src/test/setup.ts`.
  Known Reka behavior in jsdom:
  - Content of an open `Dialog`/`Popover` mounts a tick after render → `await screen.findByRole('dialog')`.
  - A closed `Select` shows the selected label a tick after mount → `await waitFor(...)`.
  - `ToggleGroup` items are buttons with `aria-pressed` (not radios/checkboxes). Assert
    `toHaveAttribute('aria-pressed', 'true')`.
  - Accessible names include child labels: a `UiButton` that is `loading` is named "Loading Save".
    Match with a regex (`{ name: /Save/ }`).
- `lucide-vue-next` icons render fine as real components. Don't assert on them unless the icon _is_
  the information (then give it an accessible label and query that).

### `src/views/`, `layouts/`, `components/layout/`, `router/`: integration

- Mock only `@/api/jellyfin/*` (automock) and the Tauri boundary (store fake, `mockKeychain()`).
  Composables, child components and Reka stay real.
- Render with `renderAt(View, '/library/lib-1', { props })` from `src/test/router.ts`. It's a memory
  router with every app route name pointing at a blank page, so the view under test is rendered
  directly and its navigations show up in `router.currentRoute`. Change the route with
  `await router.push(...)` to test route-param reactions. **When you add a route to
  `src/router/index.ts`, add it to `createTestRouter()` too.** Use `renderAt` for _any_ component
  containing a `router-link` (cards, cast rows, ...), never an ad-hoc router. A router missing the `/`
  route logs "No match found for location with path ''".
- Few, scenario-shaped tests: "first launch adds a server, signs in and opens the app", "opening another
  library starts unfiltered with one request", "redirects to login with `?redirect=`". Don't re-test
  what component or composable specs already cover.
- The navigation guard lives in `src/router/guards.ts` (`restoreSession`). Test it on
  `createTestRouter()` with `router.beforeEach(restoreSession)`, never by importing the app router
  (it uses `createWebHistory`).
- Async UI that settles after mount (saved servers, health checks, fetched items): wait with
  `findBy*` / `vi.waitFor`. A list item's content may not exist yet on the first query.
- Cards repeat their title (image fallback text plus caption). Query them as links
  (`getByRole('link', { name: /Alien/ })`) rather than by text.

## How to write a test

- **Black box.** Test the public contract: rendered output, emitted events, returned refs/actions,
  calls across the mocked boundary. Never touch `wrapper.vm`, internal functions, or private state.
- **Query priority**: `getByRole` (with `name`) → `getByLabelText` → `getByPlaceholderText` →
  `getByText` → `getByTestId` as a last resort. If a role/label query fails because the markup isn't
  accessible (e.g. a `UiInput` label not associated with its input), fix the component, don't reach
  for a test id.
- Use `getBy*` to assert presence, `queryBy*` to assert absence, `findBy*` to wait for async appearance.
- **Async**: always `await` user-event calls. After anything that resolves a mocked api promise, `await
flushPromises()` (from `@vue/test-utils`) or use `findBy*`/`waitFor`. Use `await nextTick()` only for
  a plain reactive change you made yourself. No arbitrary `setTimeout` waits.
- **Timers**: `vi.useFakeTimers()` for debounce/timeouts (`setup.ts` restores real timers after each
  test). With user-event, use `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
  **Gotcha:** when a component test needs fake timers _and_ asserts on events reaching a parent
  listener, fake only the timer functions: `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })`.
  Vue drops a bubbled event at a parent listener unless `Date.now()` has moved on since the listener
  was attached, and a fully faked clock never moves. "Does not bubble" tests would then pass even when
  the code is broken.
- **Probing**: to check whether something is a bug before deciding how to test it, write a throwaway
  spec under `src/__probe__/`, run it, and delete it. Never commit it.
- **Prove the test can fail**: after writing a layer, temporarily break each guarded behavior in the
  source (one-line `sed`), confirm the matching test goes red, then `git checkout` the source.
- **Snapshots**: never as the only assertion. Avoid them in general. A small `toMatchInlineSnapshot` of
  a generated string is fine.
- **No styling tests.** jsdom doesn't load the SCSS. Asserting a BEM modifier class _is_ fine when the
  class is the behavior (e.g. `UiButton` gets `ui-btn--danger` for `variant="danger"`).
- **Fixtures**: build Jellyfin DTOs with factories in `src/test/fixtures/` (`makeItem({ Type: 'Episode' })`)
  that return a minimal valid object plus overrides. Don't inline 30-field objects in specs.
- **Structure**: one `describe` per unit, `it` names read as behavior sentences
  (`it('clears the password after a successful login')`), arrange / act / assert separated by a
  blank line. One behavior per `it`. Several `expect`s are fine if they describe that one behavior.
- Comments follow `CLAUDE.md`: none restating the code. Only explain a non-obvious setup or workaround.

## Priorities

When choosing what to cover next, go in this order. Skip pure-markup components (skeletons, `UiCard`,
`UiAspectRatio`) unless they gain logic.

1. `utils/` and the api functions that hold logic (`library.ts` branching/filtering, `storage/auth.ts`).
2. Session and connection composables: `useAuthSession`, `useServerConnection`, `useServers`.
3. Data composables: `useJellyfinResource`, `useLibraryItems`, `useLibraryQuery`, `useItemActions`,
   plus `useDebounce`.
4. Router guard (after extracting it).
5. Interactive `ui/` primitives: `UiSelect`, `UiDropdown`, `UiInput`, `UiButton`, `UiIconButton`.
6. Interactive feature components: `LoginForm`, `AddServerDialog`, `ServerList`, `LibraryToolbar`,
   `GenreFilter`, `AlphabetRail`, `ItemActions`.
7. Integration: views (`LoginView`, `LibraryView`, ...), `components/layout/*`, and the data-fetching
   detail components (`EpisodeHeader`, `SeasonHeader`, `PersonHeader`, `SeriesContent`, `HeroBanner`).

## Checklist before finishing

- [ ] Spec sits in the sibling `__tests__/` folder and is named after its source file.
- [ ] Only the layer below is mocked. No composable, `Ui*` component or Reka primitive is mocked.
- [ ] Singleton state and timers are reset, so the spec passes alone _and_ in any order
      (`pnpm vitest run --sequence.shuffle`).
- [ ] Every async step is awaited. No snapshot-only or `wrapper.vm` assertions.
- [ ] Failure paths covered, not just the happy path.
- [ ] Each new test fails when the behavior it guards is broken (temporarily break the source to check).
- [ ] `pnpm vitest run`, `pnpm lint`, `pnpm format:check` and `pnpm vue-tsc --noEmit` all pass (specs
      under `src/` are type-checked).
- [ ] `pnpm vitest run --reporter=verbose` prints no `stderr` blocks. A `[Vue warn]` or
      `[Vue Router warn]` is either a test setup mistake to fix or a real component bug to report.
      Expected `console.error`s in failure-path tests are silenced with `vi.spyOn`.
