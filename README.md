# Notepad

A faithful Windows 95/98 Notepad clone built with Electron, React, and [98.css](https://jdan.github.io/98.css/). Dark mode is on by default.

## Philosophy

Gosh apps are built with a Linux-first mindset: simplicity, transparency, and user control.

We also provide Windows and macOS builds not as a compromise, but as an on-ramp. Many people are curious about Linux but still live on other platforms day-to-day. If these tools help someone get comfortable and eventually make the jump, we're happy to meet them where they are.

## What it does

This is a fully functional text editor styled to look and feel like classic Windows 98 Notepad. It supports creating, opening, saving, and editing text files with find & replace, go-to-line, font customization, word wrap, and a toggleable status bar showing cursor position. There's a dark mode enabled by default, and all the keyboard shortcuts you'd expect from the original (Ctrl+S, Ctrl+F, Ctrl+H, Ctrl+G, F3, F5, and so on). Unsaved changes are caught before closing. Page Setup is the only menu item that isn't implemented.

Font preferences don't persist between sessions. Print uses the system print dialog, which varies by platform.

## Installation

Grab a pre-built binary from the [Releases](https://github.com/goshitsarch-eng/gosh-notepad-cloned/releases) page, or build from source:

```bash
git clone https://github.com/goshitsarch-eng/gosh-notepad-cloned.git
cd gosh-notepad-cloned
npm install
npm run dev       # development
npm run build     # production build for your platform
```

You'll need [Node.js](https://nodejs.org/) 24.13.0 (LTS) or later. Platform-specific builds are available via `npm run build:win`, `npm run build:mac`, and `npm run build:linux`. Built artifacts end up in the `release/` directory.

An [AUR package](https://aur.archlinux.org/packages/gosh-notepad) is also available for Arch Linux users.

## Project structure

```
electron/           Electron main process and preload script
src/
  components/       React components (MenuBar, Editor, StatusBar)
  components/dialogs/  Find, Replace, GoTo, Font, About, Unsaved dialogs
  hooks/useNotepad.js  Core application logic and state
  styles/main.css      Windows 98 styling with dark/light mode
index.html          Entry point
vite.config.mjs     Vite build config
electron-builder.yml  Packaging config
aur/PKGBUILD        Arch Linux package definition
```

The frontend is a React app bundled by Vite. The Electron main process handles file I/O, native dialogs, printing, and window management via IPC. The renderer communicates through a context bridge exposed in the preload script.

## Disclaimer

This is an independent project, not affiliated with Microsoft. All Microsoft trademarks belong to Microsoft Corporation. Use at your own risk.

## License

[MIT](LICENSE)
