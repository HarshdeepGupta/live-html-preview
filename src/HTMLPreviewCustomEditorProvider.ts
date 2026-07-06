'use strict'
import * as vscode from 'vscode'
import PreviewManager from './PreviewManager'
import { buildLocalResourceRoots } from './Utilities'
import PreviewPanelRegistry from './PreviewPanelRegistry'

// Lets users reach the preview via "Reopen Editor With... -> Live HTML Preview"
// on an .html file, in addition to the sidePreview/fullPreview commands.
export default class HTMLPreviewCustomEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'liveHtmlPreview.editor';

    constructor(
        private _registry: PreviewPanelRegistry,
        private _onPanelStateChange?: () => void
    ) {}

    public static register(registry: PreviewPanelRegistry, onPanelStateChange?: () => void): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            HTMLPreviewCustomEditorProvider.viewType,
            new HTMLPreviewCustomEditorProvider(registry, onPanelStateChange),
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
        this._registry.register(document.uri, 'custom', webviewPanel, this._onPanelStateChange);
        new PreviewManager(webviewPanel, document);
    }
}
