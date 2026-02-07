# Notepad

A Windows 95/98 Notepad clone built with Electron, React, and [98.css](https://jdan.github.io/98.css/). It looks and behaves like the real thing, dark mode and all.

## Philosophy

Gosh apps are built with a Linux-first mindset: simplicity, transparency, and user control.

We also provide Windows and macOS builds not as a compromise, but as an on-ramp. Many people are curious about Linux but still live on other platforms day-to-day. If these tools help someone get comfortable and eventually make the jump, we're happy to meet them where they are.

## What it does

This is a fully functional text editor modeled after classic Windows 98 Notepad. You can create, open, save, and edit text files. It handles multiple encodings (UTF-8, UTF-8 with BOM, UTF-16 LE/BE, and ANSI/Latin-1), detects them automatically on open, and preserves them on save. Line endings (CRLF and LF) are also detected and preserved.

Find and Replace are non-modal, draggable dialogs. Find supports case sensitivity and directional search (up or down from the cursor). Replace supports single replacement and Replace All. There's a Go To Line dialog for jumping to a specific line number. F3 repeats the last search.

The editor supports word wrap, a toggleable status bar (showing line/column, line ending type, and encoding), and font selection from available system monospace fonts with four styles and a range of sizes. Dark mode is on by default, though it falls back to your OS theme preference on first launch if you haven't set one. All of these preferences -- dark mode, word wrap, status bar visibility, and font -- persist between sessions.

An auto-recovery system saves your work every 30 seconds when there are unsaved changes. If the app closes unexpectedly, it offers to restore your document on next launch.

Files can be opened by dragging them onto the editor window, by passing a path as a CLI argument, or through macOS Finder associations. Only one instance runs at a time; opening a file from a second instance passes it to the first.

On Windows (NSIS installer) and Linux (AppImage), the app checks for updates automatically via GitHub Releases and prompts you to restart when one is ready.

The right-click context menu provides quick access to Undo, Cut, Copy, Paste, Delete, and Select All. The full menu bar supports keyboard navigation with arrow keys, Enter, and Escape.

Page Setup is the only menu item that isn't implemented. Print uses the system print dialog.

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New |
| Ctrl+O | Open |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+P | Print |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Find |
| F3 | Find Next |
| Ctrl+H | Replace (Cmd+Option+F on macOS) |
| Ctrl+G | Go To Line |
| F5 | Insert Time/Date |
| Escape | Close dialog |

On macOS, Ctrl is replaced by Cmd throughout, and shortcut labels in the menus display the appropriate symbols.

## Installation

Grab a pre-built binary from the [Releases](https://github.com/goshitsarch-eng/gosh-notepad-cloned/releases) page. Builds are available for Windows (x64, arm64), macOS (arm64), and Linux (x64, arm64) in AppImage, deb, rpm, and tar.gz formats.

An [AUR package](https://aur.archlinux.org/packages/gosh-notepad) is also available for Arch Linux.

### Building from source

```bash
git clone https://github.com/goshitsarch-eng/gosh-notepad-cloned.git
cd gosh-notepad-cloned
npm install
npm run dev       # development (Vite + Electron concurrently)
npm run build     # production build for your platform
```

You'll need [Node.js](https://nodejs.org/) 20 or later. Platform-specific builds:

- `npm run build:win` -- Windows (NSIS installer)
- `npm run build:mac` -- macOS (DMG)
- `npm run build:linux` -- Linux (AppImage, deb, rpm, tar.gz)

Built artifacts end up in the `release/` directory.

## Development

`npm run dev` starts both the Vite dev server (port 5173) and Electron. The Electron process waits for Vite to be ready before launching. You can also run them separately with `npm run dev:ui` and `npm run dev:electron`.

Tests use Vitest with jsdom and React Testing Library. Run them with `npm test` (single run) or `npm run test:watch`.

## Architecture

The app is split into an Electron main process and a React renderer. The main process (`electron/main.js`) handles all file I/O, native dialogs, window management, preference storage, auto-save recovery, and auto-updates. The renderer never touches Node.js directly -- everything goes through a context bridge defined in `electron/preload.js`.

The frontend is a single-page React app bundled by Vite. Nearly all application state and logic lives in one hook, `src/hooks/useNotepad.js`, which manages file operations, edit commands, find/replace, keyboard shortcuts, preferences, and recovery. The UI components are straightforward: `MenuBar`, `Editor` (a textarea with context menu and drag-drop support), `StatusBar`, and a set of dialog components under `src/components/dialogs/`.

Styling comes from the 98.css library for the Windows 98 look, supplemented by `src/styles/main.css` for dark/light mode, scrollbar styling, dialog layout, and editor-specific rules.

If `window.electronAPI` is not available (e.g., when running in a plain browser), the hook falls back to no-op stubs so the UI still renders.

```
electron/              Main process and preload script
src/
  components/          MenuBar, Editor, StatusBar, ErrorBoundary
  components/dialogs/  Find, Replace, GoTo, Font, About, Unsaved, Message, Recovery
  hooks/useNotepad.js  Core application logic and state
  styles/main.css      Dark/light mode, layout, Windows 98 overrides
index.html             Entry point (with Content Security Policy)
vite.config.mjs        Vite build config
electron-builder.yml   Packaging config
aur/                   Arch Linux PKGBUILD
rpm/                   RPM spec file
flatpak/               Flatpak manifest, metainfo, and desktop entry
```

## Known limitations

- **Replace All breaks undo.** Single replacements use `document.execCommand('insertText')` to preserve the undo stack, but Replace All sets the textarea value directly, which clears the browser's undo history for that operation.
- **Opening a file via CLI argument or file association does not prompt to save unsaved changes** in the current document. Opening via File > Open or drag-and-drop does.
- **macOS auto-update is not supported** because it requires Apple code signing. macOS DMG users need to update manually.
- **No macOS x64 build.** Only arm64 (Apple Silicon) is built in CI.

## Disclaimer

This is an independent project, not affiliated with Microsoft. All Microsoft trademarks belong to Microsoft Corporation. Use at your own risk.

## License

[MIT](LICENSE)
