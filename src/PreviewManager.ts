'use strict'
import * as vscode from 'vscode'
import HTMLDocumentContentProvider from './HTMLDocumentContentProvider'
import Utilities from './Utilities'
import * as Constants from './Constants'


// This class initializes the previewmanager based on extension type and manages all the subscriptions
export default class PreviewManager {

    htmlDocumentContentProvider: HTMLDocumentContentProvider;
    disposable: vscode.Disposable;
    utilities: Utilities;

    constructor(utilities?: Utilities, htmlDocumentContentProvider?: HTMLDocumentContentProvider) {
        this.utilities = utilities && utilities || new Utilities();
        this.htmlDocumentContentProvider = htmlDocumentContentProvider && htmlDocumentContentProvider || new HTMLDocumentContentProvider();
        this.htmlDocumentContentProvider.generatePreview();
        // subscribe to selection change event
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions)
        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this.disposable.dispose();
    }

    public onEvent() {
        this.htmlDocumentContentProvider.update(vscode.Uri.parse(Constants.ExtensionConstants.PREVIEW_URI));
    }

}