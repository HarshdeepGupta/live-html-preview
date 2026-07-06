'use strict'
import * as vscode from 'vscode'
import HTMLDocumentContentProvider from './HTMLDocumentContentProvider'
import * as Constants from './Constants'
import * as PreviewTheme from './PreviewTheme'

export default class PreviewManager {

    private _panel: vscode.WebviewPanel;
    private _htmlProvider: HTMLDocumentContentProvider;
    private _disposables: vscode.Disposable[] = [];
    private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
    // Cached instead of read on every keystroke (scheduleUpdate is the hottest
    // path in the extension); refreshed only when this specific setting changes.
    private _debounceDelay: number;

    constructor(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
        this._panel = panel;
        this._htmlProvider = new HTMLDocumentContentProvider(document, panel.webview);
        this._debounceDelay = this.readDebounceDelay();

        this.updatePreview();

        this._disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document === document) {
                    this.scheduleUpdate();
                }
            })
        );

        this._disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(`${Constants.Configuration.SECTION}.${Constants.Configuration.DEBOUNCE_DELAY}`)) {
                    this._debounceDelay = this.readDebounceDelay();
                }
                // Theme/custom-CSS changes are a deliberate, discrete action (not
                // typing), so re-render immediately rather than debouncing -
                // otherwise an already-open preview would keep showing the old
                // theme until the next document edit.
                if (PreviewTheme.isThemeChange(e) ||
                    e.affectsConfiguration(`${Constants.Configuration.SECTION}.${Constants.Configuration.CUSTOM_CSS_ENABLED}`) ||
                    e.affectsConfiguration(`${Constants.Configuration.SECTION}.${Constants.Configuration.CUSTOM_CSS_PATH}`)) {
                    this.updatePreview();
                }
            })
        );

        panel.onDidDispose(() => this.dispose());
    }

    private readDebounceDelay(): number {
        return vscode.workspace
            .getConfiguration(Constants.Configuration.SECTION)
            .get<number>(Constants.Configuration.DEBOUNCE_DELAY, Constants.Configuration.DEBOUNCE_DELAY_DEFAULT);
    }

    private scheduleUpdate() {
        if (this._debounceTimer) { clearTimeout(this._debounceTimer); }
        this._debounceTimer = setTimeout(() => this.updatePreview(), this._debounceDelay);
    }

    private updatePreview() {
        this._panel.webview.html = this._htmlProvider.generateHTML();
    }

    dispose() {
        if (this._debounceTimer) { clearTimeout(this._debounceTimer); }
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
