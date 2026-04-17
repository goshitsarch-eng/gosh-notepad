# Changelog

## [3.1.5] - 2026-04-17

### Fixed

- **Drag-and-drop** — was silently broken on Electron ≥32 where `File.path` was removed; preload now resolves the path via `webUtils.getPathForFile` and reads through a dedicated, validated channel
- **Replace All undo history** — now preserves the undo stack (previously `editor.value = ...` clobbered it, so Ctrl+Z could not restore the pre-replace text)
- **About dialog version** — now reads from `package.json` so future bumps stay in sync automatically

### Security

- **IPC allowlist for `read-file-by-path`** — rejects any path the main process did not explicitly authorize (CLI args, macOS Finder open, second-instance); drag-drop uses a separate trusted channel validated in preload
- **Removed unreachable path-traversal check** in `save-file` — the condition was always false
- **Hardened CSP** — added `object-src 'none'`, `base-uri 'self'`, `frame-src 'none'`, `form-action 'none'`
- **Dependency CVEs** — resolved 14 advisories (3 moderate, 11 high) via `npm audit fix`, including Vite dev-server path traversal, Rollup arbitrary file write, tar symlink chain escape, undici WebSocket overflows, lodash code injection, and minimatch/picomatch ReDoS

### Performance

- **`performGoTo`** — single-pass O(1) memory; no longer materializes a full lines array for each Go-To-Line
- **Recovery auto-save** — skips writes when the buffer is unchanged since the last snapshot
- **`onOpenFileFromArg`** — now returns an unsubscribe so the `useEffect` cleans up properly

### Dependencies

- electron 40 → 41
- jsdom 28 → 29
- patch/minor bumps across react, react-dom, electron-updater, electron-builder, vitest, wait-on, @vitejs/plugin-react
- Vite held at 7.3.2 (patched) — Vite 8's default lightningcss minifier rejects invalid CSS in `98.css`

## [3.1.4] - 2026-02-22

### Fixed

- **Chromium native UI font rendering on immutable distros** — Bundled TTF fonts as extraResources (outside the asar archive) so fontconfig + Skia can find them for title bar, window chrome, and menu text on systems like Bazzite and Fedora Atomic
- **fontconfig integration** — Added automatic fontconfig configuration on Linux that points Chromium to the bundled TTF fonts before the renderer initializes, eliminating "Could not find any font" and `glyph_count: 0` errors

## [3.1.3] - 2026-02-22

### Fixed

- **AppImage text rendering on immutable distros** — Bundled Noto Sans and Noto Sans Mono fonts into the app so text renders correctly on systems without standard font packages (e.g., Bazzite, Fedora Atomic)
- **Auto-updater crash** — Fixed incorrect repository URL in `electron-builder.yml` and `package.json` that caused a 404 and unhandled promise rejection on update check
- **Auto-updater error handling** — Added error listener and catch handler so network failures or bad responses no longer crash the app
- **Repository URLs** — Corrected stale `gosh-notepad-cloned` references across all packaging metadata (AUR, RPM, Flatpak, README)

## [3.1.2] - 2026-02-07

- Sync stale versions and correct packaging metadata
- Remove unsupported macOS-13 x64 build job

## [3.1.0] - 2026-02-07

- Initial tracked release
