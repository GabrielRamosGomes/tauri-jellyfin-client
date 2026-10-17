# tauri-jellyfin-client

A desktop [Jellyfin](https://jellyfin.org/) client built with Tauri 2 and Vue 3.

Supported platforms: **Windows** and **Linux**. macOS isn't supported yet.

## Prerequisites

- [Node.js](https://nodejs.org/) with [pnpm](https://pnpm.io/) 10.33.0 (pinned via `packageManager`)
- [Rust](https://www.rust-lang.org/tools/install) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

## libmpv setup

libmpv isn't checked into the repo.

### Windows

Requires [Visual Studio 2022](https://visualstudio.microsoft.com/) (Community is fine) or Build Tools with the **Desktop development with C++** workload — the same one the Rust MSVC toolchain needs.

```bash
pnpm setup:mpv:windows
```

This downloads the pinned [shinchiro/mpv-winbuild-cmake](https://github.com/shinchiro/mpv-winbuild-cmake/releases) build into `src-tauri/lib/mpv/`, and generates `mpv.lib`. `build.rs` copies `libmpv-2.dll` next to the built exe. To upgrade mpv, bump `$Build` and `$Hash` in `scripts/setup-mpv-windows.ps1`.

### Linux

Install the libmpv development package (`mpv-libs-devel` on Fedora, included in `mpv` on Arch):

```bash
sudo apt install libmpv-dev
```

## Development

```bash
pnpm install
```

```bash
pnpm tauri dev
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
