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
- Package manager is **pnpm**: `pnpm test` (watch), `pnpm test:run`, `pnpm test:coverage`,
  `pnpm vitest run path/to/file.spec.ts` for one file.

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
    setup.ts               → jest-dom matchers, Testing Library cleanup, jsdom polyfills
    utils.ts               → render/mount helpers (withRouter, seedSession, ...)
    fixtures/              → data factories (makeItem, makeSession, ...)
    mocks/                 → reusable fakes (in-memory LazyStore, fake Jellyfin Api, ...)
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
- **Storage (`api/storage/*`)**: `keychain.ts` calls `invoke` → use `mockIPC` from
  `@tauri-apps/api/mocks` (and `clearMocks()` in `afterEach`). `@tauri-apps/plugin-store` → `vi.mock` it
  with the in-memory `LazyStore` fake from `src/test/mocks/`. Assert observable behavior through the
  module's own API (save then get round-trips, clear removes, active server is unset, ...), not which
  store keys were written.

### `src/composables/`: the core of the suite

- **Mock the `@/api/*` module(s) the composable imports. Never mock another composable.** Composables
  that read `useServerConnection`/`useAuthSession` get real instances, seeded through their public API
  (`useServerConnection().use(fakeServer)`, `useAuthSession().session.value = makeSession()`). Put
  that seeding in a `src/test/utils.ts` helper once two specs need it.
- **Singleton state persists across tests in the same file.** Reset it in `beforeEach` through the
  composable's public actions (`clearData()`, `reset()`, writing the returned refs). Only fall back to
  `vi.resetModules()` + `await import(...)` for hidden module state with no public reset (e.g. a cache),
  and re-import any mocked module after the reset so you hold the fresh `vi.fn` handles.
- **Choose the harness by what the composable uses:**
  - only `ref`/`computed`/plain functions → call it directly.
  - `watch`/`watchEffect`/`onScopeDispose` (`useJellyfinResource`, `useLibraryItems`, `useDebounce`)
    → run it inside `effectScope()` and `scope.stop()` in `afterEach`, which also exercises dispose logic.
  - `onMounted`/`onUnmounted`/`inject`/`useRoute` → mount it in a host component (a `withSetup` helper
    in `src/test/utils.ts`) and unmount in `afterEach`.
- Test the state contract every async composable here exposes: `loading` toggles around the call,
  `errorMessage` is set from the thrown `Error` (and the fallback string for non-`Error` throws), data
  is replaced or appended correctly (pagination in `useLibraryItems`), and guards short-circuit when
  `api`/`session` are missing. Silence the expected `console.error` with
  `vi.spyOn(console, 'error').mockImplementation(() => {})` in tests that exercise failure paths.

### `src/components/`: presentational, props in / events out

- No module mocks are needed. If a component seems to need one, it's breaking the
  "no `src/api/` imports" rule; flag it instead of mocking around it. (`layout/*` is the sanctioned
  exception and is tested like a view.)
- Render with `@testing-library/vue`'s `render`, interact with `userEvent.setup()`, assert on
  what the user sees and on `emitted()`.
- `v-model` components: pass `modelValue` + `'onUpdate:modelValue': (v) => rerender({ modelValue: v })`
  or assert on `emitted()['update:modelValue']`.
- Render children for real. No `shallowMount` and no stubbing `Ui*` children: they're part of the
  behavior being tested. Stub only things jsdom can't do (e.g. `node-vibrant`).
- **Reka UI / teleport**: `*Portal` content is teleported to `document.body`. Testing Library's
  `screen` already queries `document.body`, so `screen.getByRole('option', ...)` finds it. Open
  menus/selects the way a user does (`await user.click(screen.getByRole('combobox'))`). Never import
  Reka primitives into tests or assert on their internals. The polyfills Reka needs in jsdom
  (`ResizeObserver`, `scrollIntoView`, pointer-capture methods) live in `src/test/setup.ts`.
- `lucide-vue-next` icons render fine as real components. Don't assert on them unless the icon _is_
  the information (then give it an accessible label and query that).

### `src/views/`, `layouts/`, `components/layout/`, `router/`: integration

- Mock only `@/api/*`. Use a real router: `createRouter({ history: createMemoryHistory(), routes })`
  with just the routes the test needs, passed via `global.plugins`. Navigate with `await router.push()`
  then `await router.isReady()`.
- Few, scenario-shaped tests: "shows the server list when there's no session", "loads the next page
  when scrolled", "redirects to login with `?redirect=`". Don't re-test what component specs cover.
- `src/router/index.ts` builds the router with `createWebHistory` at import time. To test the guard,
  extract it into an exported function first (a small, allowed testability refactor) rather than
  importing the app router.

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
- **Timers**: `vi.useFakeTimers()` for debounce/timeouts, `vi.useRealTimers()` in `afterEach`. With
  user-event, use `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
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
7. A handful of view-level scenarios (`LoginView`, `LibraryView`).

## Checklist before finishing

- [ ] Spec sits in the sibling `__tests__/` folder and is named after its source file.
- [ ] Only the layer below is mocked. No composable, `Ui*` component or Reka primitive is mocked.
- [ ] Singleton state and timers are reset, so the spec passes alone _and_ in any order
      (`pnpm vitest run --sequence.shuffle`).
- [ ] Every async step is awaited. No snapshot-only or `wrapper.vm` assertions.
- [ ] Failure paths covered, not just the happy path.
- [ ] `pnpm test:run`, `pnpm lint` and `vue-tsc --noEmit` all pass (specs under `src/` are type-checked).
