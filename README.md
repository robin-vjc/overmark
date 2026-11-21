# Overmark

**Draw on your screen. Nothing more, nothing less.**

Overmark is a lightweight, open-source screen annotation tool for presentations, screen sharing, tutorials and recordings. Draw freehand, add rectangles, ellipses, arrows and text on top of any app, then move, resize or delete them like objects in a slide deck.

<!-- TODO: add a short demo GIF here, e.g. ![Overmark demo](docs/demo.gif) -->

Built with [Tauri](https://tauri.app) and [Konva](https://konvajs.org). Runs on Windows, macOS and Linux.

## Why Overmark?

I often want to draw on my screen, for example while giving a presentation. There are already tools for this:

- [Epic Pen](https://epicpen.com/)
- [ZoomIt](https://github.com/microsoft/PowerToys), part of Microsoft's PowerToys
- [gInk](https://github.com/geovens/gInk)
- [Pointofix](https://www.pointofix.de/hilfe_en.php)

However, I wanted something that is:

- ⚡ **Lightweight and fast**: near-zero CPU when idle, and a small installer
- 🎯 **Simple to use**
- ✨ **Modern looking**
- 🔒 **Private**: no telemetry of any kind ([see how](#privacy))
- 🧩 **Open source**: MIT licensed, contributions welcome
- 🌍 **Cross-platform**: Windows, macOS and Linux

None of these quite fit what I was looking for, so I built Overmark.

### How it compares

|                                                  | Overmark |   Epic Pen    |  ZoomIt   | gInk |     Pointofix     |
| ------------------------------------------------ | :------: | :-----------: | :-------: | :--: | :---------------: |
| Free                                             |    ✅    | 🟡 Basic only |    ✅     |  ✅  |        ✅         |
| Open source                                      |    ✅    |      ❌       |    ✅     |  ✅  | 🟡 Freeware[^src] |
| Windows                                          |    ✅    |      ✅       |    ✅     |  ✅  |        ✅         |
| macOS                                            | ✅[^os]  |      ❌       |    ✅     |  ❌  |        ❌         |
| Linux                                            | ✅[^os]  |      ❌       |    ❌     |  ❌  |        ❌         |
| Draw over a live screen and keep using your apps |    ✅    |      ✅       | 🟡[^live] |  ✅  | ❌ Freezes screen |
| Shapes and arrows                                |    ✅    |    🟡 Pro     |    ✅     |  ❌  |        ✅         |
| Text                                             |    ✅    |    🟡 Pro     |    ✅     |  ❌  |        ✅         |

Each of these tools also does things Overmark doesn't, such as zooming, screen recording, whiteboards and pen pressure. Overmark focuses on annotating a live screen and staying out of the way.

[^src]: Pointofix is free to download, but we couldn't find published source code.

[^os]: The macOS and Linux builds are not tested yet. Feedback is welcome.

[^live]: ZoomIt's default drawing mode works on a frozen snapshot of the screen. Its LiveDraw mode draws over the live screen.

_Comparison based on each project's website and documentation as of November 2026. Spotted a mistake? Please [open an issue](https://github.com/robin-vjc/overmark/issues)._

## Features

- **Pen**: freehand drawing with adjustable width
- **Rectangle, ellipse and arrow**: quick shapes for highlighting (hold <kbd>Shift</kbd> for squares, circles and 45° arrows)
- **Text**: type anywhere on screen, with adjustable size
- **Select, move, resize, rotate**: click any annotation to drag it or resize it with handles
- **Click-through by default**: in Select mode, clicks go to the app underneath unless you click an annotation or the toolbar
- **Undo and redo everything**: drawing, moving, resizing, recoloring, deleting, text edits and clearing
- **Compact, draggable toolbar**, plus keyboard shortcuts
- **Multi-monitor**: one overlay per display
- **Remembers your settings**: color, width, text size and toolbar position

## Shortcuts

On macOS, use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd>.

| Action                        | Shortcut                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Show or hide overlay (global) | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>                                |
| Select / click-through        | <kbd>V</kbd>                                                                 |
| Pen                           | <kbd>P</kbd>                                                                 |
| Rectangle                     | <kbd>R</kbd>                                                                 |
| Ellipse                       | <kbd>E</kbd>                                                                 |
| Arrow                         | <kbd>A</kbd>                                                                 |
| Text                          | <kbd>T</kbd>                                                                 |
| Red / yellow / green / blue   | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>                          |
| Pen width or text size        | <kbd>Ctrl</kbd>+<kbd>Scroll</kbd>                                            |
| Delete selected               | <kbd>Del</kbd>                                                               |
| Undo                          | <kbd>Ctrl</kbd>+<kbd>Z</kbd>                                                 |
| Redo                          | <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> |
| Clear all                     | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>                                |
| Deselect, then back to Select | <kbd>Esc</kbd>                                                               |

- With shapes selected, <kbd>Ctrl</kbd>+<kbd>Scroll</kbd> and the color keys change those shapes.
- In Select mode, double-click text to edit it. <kbd>Esc</kbd> or <kbd>Ctrl</kbd>+<kbd>Enter</kbd> finishes editing.
- More colors are available on the toolbar. Click the size indicator on the toolbar for a slider, or scroll over the toolbar to change the size.
- Keyboard shortcuts other than the global one only work while Overmark has focus. After you click through to another app, click an annotation or the toolbar first.

## Install

Download the latest release for your platform from the [Releases](https://github.com/robin-vjc/overmark/releases) page.

| Platform        | Status                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Windows 10/11   | ✅ Supported                                                                      |
| macOS 11+       | 🧪 Untested: feedback welcome                                                     |
| Linux (X11)     | 🧪 Untested: feedback welcome                                                     |
| Linux (Wayland) | ⚠️ Limited: some compositors restrict always-on-top overlays and global shortcuts |

## Build from source

Prerequisites: [Rust](https://rustup.rs), [Node.js](https://nodejs.org) 20.19+, [pnpm](https://pnpm.io), and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```sh
git clone https://github.com/robin-vjc/overmark.git
cd overmark
pnpm install
pnpm tauri dev      # run in development
pnpm tauri build    # produce an installer
```

## Privacy

Privacy is enforced by the app's configuration:

- The webview has a strict Content Security Policy that blocks outside connections.
- The app is granted no network, filesystem or shell permissions ([`capabilities/default.json`](src-tauri/capabilities/default.json)).
- There is no telemetry and no auto-updater.
- The only file it writes is its own `settings.json`.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the project structure, coding style and how to submit a pull request.

## License

[MIT](LICENSE)
