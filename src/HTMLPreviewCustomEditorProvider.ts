'use strict'
import * as vscode from 'vscode'
import PreviewManager from './PreviewManager'
import { buildLocalResourceRoots } from './Utilities'

// Lets users reach the preview via "Reopen Editor With... -> Live HTML Preview"
// on an .html file, in addition to the sidePreview/fullPreview commands.
export default class HTMLPreviewCustomEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'liveHtmlPreview.editor';

    // Notified whenever a resolved preview editor gains/loses focus, so the
    // status bar can stay visible/accurate while a preview is active.
    constructor(private _onPreviewPanelViewStateChange?: (active: boolean) => void) {}

    public static register(onPreviewPanelViewStateChange?: (active: boolean) => void): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            HTMLPreviewCustomEditorProvider.viewType,
            new HTMLPreviewCustomEditorProvider(onPreviewPanelViewStateChange),
            { webviewOptions: { retainContextWhenHidden: true } }
        );
    }

    resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void {
        // enableScripts/localResourceRoots can't be set via registerCustomEditorProvider's
        // options, only here on the resolved panel's webview.
        webviewPanel.webview.options = {
            enableScripts: false,
            localResourceRoots: buildLocalResourceRoots(document)
        };
        webviewPanel.onDidChangeViewState(e => this._onPreviewPanelViewStateChange?.(e.webviewPanel.active));
        new PreviewManager(webviewPanel, document);
    }
}
