'use strict'
import * as vscode from 'vscode'
import HTMLDocumentContentProvider from './HTMLDocumentContentProvider'
import Utilities from './Utilities'
import StatusBarItem from './StatusBarItem'
import * as Constants from './Constants'


// This class initializes the previewmanager based on extension type and manages all the subscriptions
export default class PreviewManager {

    htmlDocumentContentProvider: HTMLDocumentContentProvider;
    disposable: vscode.Disposable;
    utilities: Utilities;
    statusBarItem: StatusBarItem;

    constructor(utilities?: Utilities, htmlDocumentContentProvider?: HTMLDocumentContentProvider) {
        this.utilities = utilities && utilities || new Utilities();
        this.htmlDocumentContentProvider = htmlDocumentContentProvider && htmlDocumentContentProvider || new HTMLDocumentContentProvider();
        this.htmlDocumentContentProvider.generateHTML();
        // subscribe to selection change event
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions)
        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this.disposable.dispose();
    }

    private onEvent() {
        this.htmlDocumentContentProvider.update(vscode.Uri.parse(Constants.ExtensionConstants.PREVIEW_URI));
        // this.updatePreviewStatus();
        // console.log(Constants.SessionVariables.IS_PREVIEW_BEING_SHOWN);
    }

    // updatePreviewStatus() {
    //     let visibleEditors = vscode.window.visibleTextEditors;
    //     console.log(visibleEditors)
    //     for (let editor of visibleEditors) {
    //         console.log(editor.document.uri);
    //         console.log(vscode.Uri.parse(Constants.ExtensionConstants.PREVIEW_URI));
    //         if (editor.document.uri === vscode.Uri.parse(Constants.ExtensionConstants.PREVIEW_URI)) {
    //             Constants.SessionVariables.IS_PREVIEW_BEING_SHOWN = true;
    //             return;
    //         }
    //     }
    //     Constants.SessionVariables.IS_PREVIEW_BEING_SHOWN = false;
    // }



}