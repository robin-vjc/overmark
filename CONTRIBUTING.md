# Contributing to Overmark

Thanks for helping out! Bug reports, ideas and pull requests are all welcome.

## Getting started

1. Install [Rust](https://rustup.rs), [Node.js](https://nodejs.org) 20.19+, [pnpm](https://pnpm.io) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
2. `pnpm install`
3. `pnpm tauri dev`

## Before opening a pull request

```sh
pnpm check                                   # typecheck, ESLint, Prettier
cd src-tauri
cargo fmt --check
cargo clippy --all-targets -- -D warnings
```

CI runs the same checks on Windows, macOS and Linux.

## How it works

Overmark opens one transparent, always-on-top, borderless window per monitor. Each window runs the same web frontend, which draws annotations with Konva.

**Click-through.** In drawing tools, the overlays capture the mouse. In Select mode they ignore it, except when the cursor is over an annotation or the toolbar. A window that ignores the mouse gets no mouse events, so the Rust side polls the cursor position (only in Select mode, and only acting when it moves). It sends a `probe` event to the overlay under the cursor. The frontend answers through `set_hit`, and Rust toggles `set_ignore_cursor_events`.

**Undo/redo.** Each overlay keeps its own command stack (`src/history`). The backend records which overlay made each change, so <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the most recent change on any monitor.

**Settings** are shared between windows through Tauri events and saved by the primary overlay using `tauri-plugin-store`.

## Project structure

```
src/                     Frontend (TypeScript, no UI framework)
├─ main.ts               Wires everything together; defines toolbar/shortcut actions
├─ ipc.ts                Typed wrappers for Rust commands
├─ settings.ts           Shared, persisted settings and the color palette
├─ canvas/
│  ├─ stage.ts           Konva stage and layers
│  ├─ shapes.ts          Shape factories and attribute helpers
│  └─ selection.ts       Selection handles, move/resize/delete
├─ tools/                One file per tool (pen, shapes, text, select)
├─ history/              Undo/redo stack and commands
├─ input/                Pointer routing, shortcuts, click-through hit test
└─ ui/                   Toolbar and icons

src-tauri/src/           Backend (Rust)
├─ lib.rs                App setup, plugins, commands
├─ overlay.rs            Creates one overlay per monitor
├─ passthrough.rs        Click-through polling and draw/select mode
├─ history.rs            Global undo/redo order across overlays
└─ hotkeys.rs            Global show/hide shortcut
```

## Guidelines

- Keep it light. Avoid new dependencies unless they clearly pay for themselves.
- Keep it private. Overmark must never make network requests. Don't add permissions to `src-tauri/capabilities/default.json` unless a feature truly needs them.
- Keep it idle-friendly: no timers or animation loops that run while nothing is happening.
- New tools go in `src/tools/` and implement the `Tool` interface. Changes to shapes should be recorded in the history so they can be undone.
- Prefer small, focused pull requests with a short description of what changed and why.
