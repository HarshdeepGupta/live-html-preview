'use strict';
import * as vscode from 'vscode';
import * as Constants from './Constants'
import PreviewManager from './PreviewManager'
import Utilities from './Utilities'


export function activate(context: vscode.ExtensionContext) {

    let previewUri = vscode.Uri.parse(Constants.ExtensionConstants.PREVIEW_URI);
    let disposableSidePreview = vscode.commands.registerCommand('extension.sidePreview', () => {

        init(vscode.ViewColumn.Two, context, previewUri);

    });
    let disposableStandalonePreview = vscode.commands.registerCommand('extension.fullPreview', () => {

        init(vscode.ViewColumn.One, context, previewUri);

    });
    context.subscriptions.push(disposableSidePreview);
    context.subscriptions.push(disposableStandalonePreview);
}

// This method is called when extension is deactivated
export function deactivate() {

}

function init(viewColumn: number, context: vscode.ExtensionContext, previewUri: vscode.Uri) {

    let utilities = new Utilities();
    let proceed = utilities.checkDocumentIsHTML();
    if (proceed) {
        let previewManager = new PreviewManager();
        let registration = vscode.workspace.registerTextDocumentContentProvider('details-preview', previewManager.htmlDocumentContentProvider);
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, viewColumn).then((success) => {
        });
    }


}



