import * as vscode from 'vscode'
"use strict"

export default class StatusBarItem {

    statusBarItem: vscode.StatusBarItem;

    updateStatusbar() {
        // console.log("Update called");

        let editor = vscode.window.activeTextEditor;

        // Create as needed
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
        if (!editor) {
            this.statusBarItem.hide();
            return;
        }
        // Only update status if an HTML file
        if (editor.document.languageId === "html") {
            // Update the status bar
            this.statusBarItem.text = 'Preview Available';
            this.statusBarItem.show();
        }
        else {
            this.statusBarItem.hide();
        }
    }
}