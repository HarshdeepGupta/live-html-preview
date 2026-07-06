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

    constructor(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
        this._panel = panel;
        this._htmlProvider = new HTMLDocumentContentProvider(document, panel.webview);

        this.updatePreview();

        this._disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document === document) {
                    this.scheduleUpdate();
                }
            })
        );

        // Theme/custom-CSS changes are a deliberate, discrete action (not typing),
        // so re-render immediately rather than debouncing - otherwise an already-open
        // preview would keep showing the old theme until the next document edit.
        this._disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (PreviewTheme.isThemeChange(e) ||
                    e.affectsConfiguration(`${Constants.Configuration.SECTION}.${Constants.Configuration.CUSTOM_CSS_ENABLED}`) ||
                    e.affectsConfiguration(`${Constants.Configuration.SECTION}.${Constants.Configuration.CUSTOM_CSS_PATH}`)) {
                    this.updatePreview();
                }
            })
        );

        panel.onDidDispose(() => this.dispose());
    }

    private scheduleUpdate() {
        if (this._debounceTimer) { clearTimeout(this._debounceTimer); }
        const delay = vscode.workspace
            .getConfiguration(Constants.Configuration.SECTION)
            .get<number>(Constants.Configuration.DEBOUNCE_DELAY, Constants.Configuration.DEBOUNCE_DELAY_DEFAULT);
        this._debounceTimer = setTimeout(() => this.updatePreview(), delay);
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
