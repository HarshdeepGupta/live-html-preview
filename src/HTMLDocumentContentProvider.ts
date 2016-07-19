"use strict"
import * as vscode from 'vscode'

/**
 * HTMLDocumentContentProvider 
 */
export default class HTMLDocumentContentProvider implements vscode.TextDocumentContentProvider {

    private _onDidChange: vscode.EventEmitter<vscode.Uri>;


    constructor() {
        this._onDidChange = new vscode.EventEmitter<vscode.Uri>();
    }

    provideTextDocumentContent(uri: vscode.Uri): string | Promise<string> {
        let self = this;
        return new Promise<string>(function(resolve,reject){
            resolve(self.generatePreview());
        }).then((data)=>{
            return data;
        }).catch(()=>{
            vscode.window.showErrorMessage("Error occured in provideTextDocumentContent");
        })
    };

    public generatePreview() : Promise<String>{
        let text: string = vscode.window.activeTextEditor.document.getText();
        return new Promise<string>(function(resolve,reject){
            resolve(text);
        }).then((data)=>{
            return data;
        }).catch(()=>{
            vscode.window.showErrorMessage("Error occured in generatePreview");
        })
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }


}