"use strict"
import * as vscode from 'vscode';
import PreviewManager from './previewManager'
import * as Constants from './Constants'

export default class Utilities {
    //returns true if an html document is open
    constructor() { };
    checkDocumentIsHTML(showWarning: boolean): boolean {
        let result = vscode.window.activeTextEditor.document.languageId.toLowerCase() === "html"
        if (!result && showWarning) {
            vscode.window.showInformationMessage(Constants.ErrorMessages.NO_HTML);
        }
        return result;
    }
    init(viewColumn: number, context: vscode.ExtensionContext, previewUri: vscode.Uri) {
        let proceed = this.checkDocumentIsHTML(true);
        if (proceed) {
            let previewManager = new PreviewManager();
            let registration = vscode.workspace.registerTextDocumentContentProvider('HTMLPreview', previewManager.htmlDocumentContentProvider);
            return vscode.commands.executeCommand('vscode.previewHtml', previewUri, viewColumn).then((success) => {
            });
        }
    }

}