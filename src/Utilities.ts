"use strict"
import * as vscode from 'vscode';
import * as path from 'path';
import PreviewManager from './PreviewManager'
import * as Constants from './Constants'

// Local resources the preview webview is allowed to load: the document's own
// directory, the extension's own assets (bundled custom_style.css), and any
// open workspace folders (so workspace-relative src/href paths resolve too).
export function buildLocalResourceRoots(document: vscode.TextDocument): vscode.Uri[] {
    const roots: vscode.Uri[] = [vscode.Uri.file(path.dirname(document.fileName))];

    const ext = vscode.extensions.getExtension(Constants.ExtensionConstants.EXTENSION_ID);
    if (ext) { roots.push(ext.extensionUri); }

    (vscode.workspace.workspaceFolders ?? []).forEach(f => roots.push(f.uri));
    return roots;
}

export default class Utilities {

    private _panels: Map<string, vscode.WebviewPanel> = new Map();

    // Notified whenever a preview panel this instance opens gains/loses focus,
    // so the status bar can stay visible/accurate while a preview is active.
    constructor(private _onPreviewPanelViewStateChange?: (active: boolean) => void) {}

    // Status-bar visibility check only: synchronous, always reflects the
    // currently active editor (never a menu-supplied uri).
    checkDocumentIsHTML(showWarning: boolean): boolean {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return false; }
        const result = editor.document.languageId.toLowerCase() === "html";
        if (!result && showWarning) {
            vscode.window.showInformationMessage(Constants.ErrorMessages.NO_HTML);
        }
        return result;
    }

    // Resolves the document a command should act on: the uri VS Code passes
    // when a command is invoked from explorer/context (right-clicking a file
    // that may not be the active editor), falling back to the active editor
    // for keybindings/Command Palette/editor-title invocations.
    async resolveHtmlDocument(uri: vscode.Uri | undefined, showWarning: boolean): Promise<vscode.TextDocument | undefined> {
        const document = uri ? await vscode.workspace.openTextDocument(uri) : vscode.window.activeTextEditor?.document;
        if (!document || document.languageId.toLowerCase() !== "html") {
            if (showWarning) { vscode.window.showInformationMessage(Constants.ErrorMessages.NO_HTML); }
            return undefined;
        }
        return document;
    }

    async init(viewColumn: vscode.ViewColumn, context: vscode.ExtensionContext, uri?: vscode.Uri) {
        const document = await this.resolveHtmlDocument(uri, true);
        if (!document) { return; }

        const docKey = document.uri.toString();

        // Reveal existing panel instead of opening a duplicate
        const existing = this._panels.get(docKey);
        if (existing) {
            existing.reveal(viewColumn);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'liveHtmlPreview',
            `Preview: ${path.basename(document.fileName)}`,
            viewColumn,
            {
                // Scripts are disabled: the webview renders arbitrary, untrusted
                // HTML from whatever file the user has open, and there is no CSP
                // in place to constrain what a script could do (e.g. exfiltrate
                // workspace file contents via fetch()). README documents this.
                enableScripts: false,
                localResourceRoots: buildLocalResourceRoots(document),
                retainContextWhenHidden: true
            }
        );

        this._panels.set(docKey, panel);
        panel.onDidDispose(() => this._panels.delete(docKey), null, context.subscriptions);
        panel.onDidChangeViewState(
            e => this._onPreviewPanelViewStateChange?.(e.webviewPanel.active),
            null,
            context.subscriptions
        );

        new PreviewManager(panel, document);
    }
}
