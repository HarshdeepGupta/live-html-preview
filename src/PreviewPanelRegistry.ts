'use strict'
import * as vscode from 'vscode'

export type PreviewMode = 'side' | 'full' | 'custom'

// Single source of truth for currently open preview panels, keyed by document
// + mode so side/full previews of the same document don't collide with each
// other (each is revealed/reused independently), while a custom-editor
// preview (which already shows the document live, replacing its own editor
// tab) is reused instead of letting a redundant side/full panel spawn beside
// it. Also centralizes the focus/dispose wiring every panel needs identically,
// so callers can't forget to seed the initial state or reset it on close -
// the state consumers (like the status bar) want isn't "the last panel that
// fired an event" but "is any tracked panel currently active", computed fresh
// from each panel's own live `.active` property.
export default class PreviewPanelRegistry {

    private _panels: Map<string, vscode.WebviewPanel> = new Map();

    private key(uri: vscode.Uri, mode: PreviewMode): string {
        return `${mode}:${uri.toString()}`;
    }

    get(uri: vscode.Uri, mode: PreviewMode): vscode.WebviewPanel | undefined {
        return this._panels.get(this.key(uri, mode));
    }

    hasActivePanel(): boolean {
        for (const panel of this._panels.values()) {
            if (panel.active) { return true; }
        }
        return false;
    }

    register(uri: vscode.Uri, mode: PreviewMode, panel: vscode.WebviewPanel, onActiveChange?: () => void): void {
        const key = this.key(uri, mode);
        this._panels.set(key, panel);

        panel.onDidChangeViewState(() => onActiveChange?.());
        panel.onDidDispose(() => {
            this._panels.delete(key);
            onActiveChange?.();
        });

        onActiveChange?.();
    }
}
