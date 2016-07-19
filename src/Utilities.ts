"use strict"
import * as vscode from 'vscode';

export default class Utilities{
    //returns true if an html document is open
    constructor(){};
    checkDocumentIsHTML(): boolean{
        return vscode.window.activeTextEditor.document.languageId.toLowerCase() === "html";
    }
}