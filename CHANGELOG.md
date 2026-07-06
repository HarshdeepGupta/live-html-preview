# Changelog

## 0.4.0 - 2026-07-06

First update since 2017 - a full modernization pass. If you're upgrading from 0.3.0, everything below is new.

### Added
- Preview theme control: `auto` (matches the page's own light/dark CSS, like a real browser), `light`, or `dark`. Switch it from a toolbar icon on the preview tab, the Status Bar, a `ctrl+q t` keybinding, the right-click "Preview" submenu, or the Command Palette - all stay in sync.
- Right-click "Preview" submenu (editor and Explorer) to open a Side or Full preview directly in a specific theme, or open in browser, in one click.
- "Reopen Editor With... -> Live HTML Preview" support, so the preview can replace the editor tab in place.
- Configurable debounce delay (`liveHtmlPreview.debounceDelay`) and custom preview stylesheet (`liveHtmlPreview.customCss.enabled` / `.path`).
- Remote-safe "Open in browser": tries VS Code's built-in Simple Browser over Remote-SSH/WSL/Codespaces before falling back to your external browser.

### Changed
- Scripts are now disabled inside the preview webview. The preview renders arbitrary HTML from whatever file you have open, and there was no CSP constraining what a script could do; this closes that gap.
- Bundled with esbuild instead of shipping raw compiled output - smaller, faster-loading extension.
- Minimum supported VS Code version is now 1.85.0 (previously an older floor from 2022).

### Fixed
- The preview used to unconditionally force a white background, so a page with its own dark-mode CSS could never actually show it in preview. Fixed - `auto` now shows the page exactly as authored, with `light`/`dark` as an explicit opt-in override.
- Several preview-panel bugs: opening Side Preview and Full Preview for the same file could collide into one panel instead of coexisting; "Reopen Editor With..." could open a redundant duplicate preview instead of reusing an existing one; the Status Bar's preview indicator could get stuck visible after closing a preview.
- In-page anchor links (`#section`), `mailto:`, and `tel:` links in previewed HTML no longer get corrupted by the preview's link-rewriting.
