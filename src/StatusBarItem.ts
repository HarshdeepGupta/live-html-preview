"use strict"
import * as vscode from 'vscode'
import Utilities from "./Utilities"
import * as PreviewTheme from './PreviewTheme'

// Two compact, icon-led status bar items shown only while an HTML file is
// active: one to open the preview, one showing/cycling the preview theme.
export default class StatusBarItem {

    private _previewItem: vscode.StatusBarItem;
    private _themeItem: vscode.StatusBarItem;
    private _utilities: Utilities;
    // Queried fresh on every refresh instead of tracked as a pushed boolean:
    // activeTextEditor alone isn't a reliable signal for "a preview panel is
    // focused" (VS Code just retains its previous value while a webview has
    // focus), but re-deriving "is any tracked panel currently active" from
    // PreviewPanelRegistry on demand can't go stale the way a push-based flag
    // could (e.g. never reset when the focused panel is closed).
    private _isPreviewPanelActive: () => boolean = () => false;

    constructor(utilities?: Utilities) {
        this._utilities = utilities ?? new Utilities();

        this._previewItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this._previewItem.name = "Live HTML Preview";
        this._previewItem.text = "$(open-preview)";
        this._previewItem.tooltip = "Live HTML Preview: open side preview";
        this._previewItem.command = "extension.sidePreview";

        this._themeItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        this._themeItem.name = "Live HTML Preview Theme";
        this._themeItem.command = "extension.cyclePreviewTheme";
    }

    updateStatusbar() {
        const isHtml = !!vscode.window.activeTextEditor && this._utilities.checkDocumentIsHTML(false);
        if (!isHtml && !this._isPreviewPanelActive()) {
            this._previewItem.hide();
            this._themeItem.hide();
            return;
        }

        this._previewItem.show();
        this.refreshThemeItem();
        this._themeItem.show();
    }

    // Called once with a query function (PreviewPanelRegistry.hasActivePanel)
    // that's re-evaluated on every refresh, so the status bar (the one place
    // the active theme is shown) stays accurate whenever any preview panel is
    // focused or closed - not just when its source .html editor is.
    setPreviewPanelActiveQuery(query: () => boolean) {
        this._isPreviewPanelActive = query;
    }

    // Called whenever liveHtmlPreview.previewTheme changes, from any surface
    // (this item, the cycle icon, the right-click submenu, or settings.json).
    refreshThemeItem() {
        const theme = PreviewTheme.getTheme();
        const label = theme.charAt(0).toUpperCase() + theme.slice(1);
        this._themeItem.text = `$(color-mode) ${label}`;
        this._themeItem.tooltip = `Preview theme: ${label} (click to cycle)`;
    }

    dispose() {
        this._previewItem.dispose();
        this._themeItem.dispose();
    }
}
