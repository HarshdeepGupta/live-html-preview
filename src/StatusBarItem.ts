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
    // True while a live preview panel (side/full/custom editor) is the focused
    // editor. activeTextEditor alone isn't a reliable signal here - VS Code
    // just retains its previous value while a webview has focus - so preview
    // panels report their own focus explicitly via setPreviewPanelActive().
    private _isPreviewPanelActive = false;

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
        if (!isHtml && !this._isPreviewPanelActive) {
            this._previewItem.hide();
            this._themeItem.hide();
            return;
        }

        this._previewItem.show();
        this.refreshThemeItem();
        this._themeItem.show();
    }

    // Called from each preview panel's onDidChangeViewState, so the status bar
    // (the one place the active theme is shown) stays visible whenever a
    // preview is focused - not just when its source .html editor is.
    setPreviewPanelActive(active: boolean) {
        this._isPreviewPanelActive = active;
        this.updateStatusbar();
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
