"use strict"
import * as vscode from 'vscode'
import * as path from "path";
import * as Constants from './Constants'

/**
 * HTMLDocumentContentProvider 
 */
export default class HTMLDocumentContentProvider implements vscode.TextDocumentContentProvider {

    private _onDidChange: vscode.EventEmitter<vscode.Uri>;


    constructor() {
        this._onDidChange = new vscode.EventEmitter<vscode.Uri>();
    }

    provideTextDocumentContent(uri: vscode.Uri): string {
        return this.generateHTML();
    };

    public generateHTML(): string {
        let plainText: string = vscode.window.activeTextEditor.document.getText();
        let html = this.fixLinks(plainText);
        return html;
    }

    // Thanks to Thomas Haakon Townsend for coming up with this regex
    private fixLinks(html: string): string {
        let documentFileName = vscode.window.activeTextEditor.document.fileName;
        return html.replace(
            new RegExp("((?:src|href)=[\'\"])((?!http|\\/).*?)([\'\"])", "gmi"),
            (subString: string, p1: string, p2: string, p3: string): string => {
                return [
                    p1,
                    vscode.Uri.file(path.join(
                        path.dirname(documentFileName),
                        p2
                    )),
                    p3
                ].join("");
            }
        );
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }
}