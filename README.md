# Overmark

Overmark is a lightweight, open-source screen annotation tool for presentations, screen sharing, tutorials and recordings. Draw freehand, add rectangles, ellipses, arrows and text on top of any app, then move, resize or delete them like objects in a slide deck.

Built with [Tauri](https://tauri.app) and [Konva](https://konvajs.org). Runs on Windows, macOS and Linux.

I find myself often wanting to draw on the screen while, e.g., giving presentations. There already are tools out there for this:
* [EpicPen](https://epicpen.com/)
* ZoomIt, in Microsoft's [PowerToys](https://github.com/microsoft/PowerToys)
* [gInk](https://github.com/geovens/gInk)
* [pointToFix](https://www.pointofix.de/hilfe_en.php)

However, I wanted something
* lightweight & fast -- overmark's memory and CPU footprints are tiny
* simple to use
* modern looking
* private -- overmark does not have *any* telemetry at all; you can check the code and build it yourself

None of the options above filled this gap. Hence why I created overmark.

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

Download the latest release for your platform from the [Releases](../../releases) page.

| Platform        | Status                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| Windows 10/11   | ✅ Supported                                                                      |
| macOS 11+       | ✅ Supported                                                                      |
| Linux (X11)     | ✅ Supported (best effort)                                                        |
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

## Note on Privacy

Privacy is enforced by the app's configuration, not just promised. The webview has a strict Content Security Policy that blocks outside connections, and the app is granted no network, filesystem or shell permissions ([`capabilities/default.json`](src-tauri/capabilities/default.json)). The only file it writes is its own `settings.json`.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the project structure, coding style and how to submit a pull request.

## License

[MIT](LICENSE)
