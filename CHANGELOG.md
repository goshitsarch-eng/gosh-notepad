# Changelog

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
